import { DatabaseSync } from 'node:sqlite';

import {
  createHistoryRepository,
  RETENTION_MS,
} from '../src/storage/historyRepository';

const NOW = '2026-11-22T22:00:00.000Z';

const price = {
  validated: true,
  amount: '200',
  currency: 'XOF',
  unit: 'kg',
  collectedOn: '2026-11-20',
  product: 'maize',
  market: 'natitingou',
};

function openNodeDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return {
    async getUserVersion() {
      return db.prepare('PRAGMA user_version').get().user_version;
    },
    async setUserVersion(version) {
      const next = Number(version);
      db.exec(`PRAGMA user_version = ${next}`);
    },
    async exec(sql) {
      db.exec(sql);
    },
    async run(sql, params = []) {
      db.prepare(sql).run(...params);
    },
    async all(sql, params = []) {
      return db.prepare(sql).all(...params);
    },
  };
}

function turn(
  text,
  answer = { id: 'a1', text: 'Précisez le marché.', status: 'clarification' },
) {
  return {
    language: 'fr',
    messages: [
      {
        id: `q-${text}`,
        role: 'user',
        text,
        responseStatus: 'question',
      },
      {
        id: answer.id,
        role: 'assistant',
        text: answer.text,
        responseStatus: answer.status,
        price: answer.price ?? null,
      },
    ],
  };
}

describe('local conversation history', () => {
  test('writes a consultation and reads it again from the same database', async () => {
    const db = openNodeDatabase();
    const repository = createHistoryRepository(db);

    const saved = await repository.save(
      turn('Quel est le prix du maïs à Natitingou ?', {
        id: 'a1',
        text: '',
        status: 'price',
        price,
      }),
      NOW,
    );
    const reopened = createHistoryRepository(db);
    const loaded = await reopened.load(NOW);

    expect(saved).toEqual({ ok: true, saved: 2 });
    expect(loaded.ok).toBe(true);
    expect(loaded.messages.map((message) => message.text)).toEqual([
      'Quel est le prix du maïs à Natitingou ?',
      '',
    ]);
    expect(loaded.messages[1]).toMatchObject({
      historical: true,
      kind: 'price',
      responseStatus: 'price',
      price: { amount: '200', currency: 'XOF', historical: true },
    });
  });

  test('keeps a recent message and deletes one that is seven days old', async () => {
    const db = openNodeDatabase();
    const repository = createHistoryRepository(db);
    const exact = new Date(Date.parse(NOW) - RETENTION_MS).toISOString();
    const keptAt = new Date(Date.parse(NOW) - RETENTION_MS + 1).toISOString();

    await repository.save(turn('Question expirée'), exact);
    await repository.save(
      turn('Question conservée', {
        id: 'a2',
        text: 'Toujours là.',
        status: 'clarification',
      }),
      keptAt,
    );

    const loaded = await repository.load(NOW);

    expect(loaded.messages.map((message) => message.text)).toEqual([
      'Question conservée',
      'Toujours là.',
    ]);
  });

  test('keeps an unreadable timestamp instead of deleting it', async () => {
    const db = openNodeDatabase();
    const repository = createHistoryRepository(db);
    await repository.save(turn('Question illisible'), NOW);
    await db.run(`UPDATE messages SET created_at = 'pas-une-date'`);

    const loaded = await repository.load('2099-01-01T00:00:00.000Z');

    expect(loaded.ok).toBe(true);
    expect(loaded.messages).toHaveLength(2);
  });

  test('shows an empty history when the database is new', async () => {
    const loaded = await createHistoryRepository(openNodeDatabase()).load(NOW);

    expect(loaded).toEqual({ ok: true, messages: [] });
  });

  test('does not store a network failure as a price', async () => {
    const repository = createHistoryRepository(openNodeDatabase());

    const saved = await repository.save(
      {
        language: 'fr',
        messages: [
          {
            id: 'net',
            role: 'assistant',
            text: '',
            responseStatus: 'networkError',
            price,
          },
        ],
      },
      NOW,
    );
    const loaded = await repository.load(NOW);

    expect(saved).toEqual({ ok: true, saved: 0 });
    expect(loaded.messages).toEqual([]);
  });

  test('stores an unavailable answer without an amount', async () => {
    const repository = createHistoryRepository(openNodeDatabase());
    await repository.save(
      turn('Prix du riz ?', {
        id: 'a1',
        text: 'Aucun prix validé.',
        status: 'unavailable',
      }),
      NOW,
    );

    const loaded = await repository.load(NOW);

    expect(loaded.messages[1]).toMatchObject({
      kind: 'text',
      price: null,
      responseStatus: 'unavailable',
      text: 'Aucun prix validé.',
    });
  });

  test('hides a message that was not finalized', async () => {
    const db = openNodeDatabase();
    const repository = createHistoryRepository(db);
    await repository.save(turn('Question interrompue'), NOW);
    await db.run('UPDATE messages SET finalized = 0');

    const loaded = await repository.load(NOW);

    expect(loaded.messages).toEqual([]);
  });

  test('rolls back a consultation interrupted while it is being written', async () => {
    const db = openNodeDatabase();
    let runs = 0;
    const repository = createHistoryRepository({
      ...db,
      async run(sql, params) {
        runs += 1;
        if (runs === 3) {
          throw new Error('interrupted');
        }
        return db.run(sql, params);
      },
    });

    const saved = await repository.save(turn('Question coupée'), NOW);
    const loaded = await createHistoryRepository(db).load(NOW);

    expect(saved).toEqual({ ok: false, reason: 'write' });
    expect(loaded).toEqual({ ok: true, messages: [] });
  });

  test('reports a full database without dropping earlier messages', async () => {
    const db = openNodeDatabase();
    const repository = createHistoryRepository(db);
    await repository.save(turn('Question déjà là'), NOW);
    const full = createHistoryRepository({
      ...db,
      async run() {
        throw new Error('database or disk is full');
      },
    });

    const saved = await full.save(
      turn('Question refusée', {
        id: 'a2',
        text: 'Non enregistrée.',
        status: 'clarification',
      }),
      NOW,
    );
    const loaded = await repository.load(NOW);

    expect(saved).toEqual({ ok: false, reason: 'full' });
    expect(loaded.messages.map((message) => message.text)).toEqual([
      'Question déjà là',
      'Précisez le marché.',
    ]);
  });

  test('refuses a newer schema without deleting stored messages', async () => {
    const db = openNodeDatabase();
    const repository = createHistoryRepository(db);
    await repository.save(turn('Question à conserver'), NOW);
    await db.setUserVersion(9);

    const blocked = await repository.load(NOW);
    const remaining = await db.all('SELECT id FROM messages');
    await db.setUserVersion(1);
    const restored = await repository.load(NOW);

    expect(blocked).toEqual({
      ok: false,
      reason: 'migration',
      messages: [],
    });
    expect(remaining).toHaveLength(2);
    expect(restored.messages).toHaveLength(2);
  });
});
