import { canShowPrice } from '../services/conversation';

export const SCHEMA_VERSION = 1;
export const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const PERSISTED_STATUSES = new Set([
  'question',
  'price',
  'clarification',
  'unavailable',
  'marketUncovered',
  'noValidatedData',
]);

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  language TEXT NOT NULL,
  response_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  finalized INTEGER NOT NULL DEFAULT 0,
  amount TEXT,
  currency TEXT,
  unit TEXT,
  collected_on TEXT,
  product TEXT,
  market TEXT,
  validated INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
`;

const ISO_TIMESTAMP = '????-??-??T??:??:??.???Z';

export function retentionCutoff(nowIso) {
  const now = Date.parse(nowIso);
  if (Number.isNaN(now)) {
    return null;
  }
  return new Date(now - RETENTION_MS).toISOString();
}

export function createHistoryRepository(db) {
  let chain = Promise.resolve();
  const exclusive = (work) => {
    const run = chain.then(work, work);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
  return {
    load(nowIso) {
      return exclusive(() => loadHistory(db, nowIso));
    },
    save(turn, nowIso) {
      return exclusive(() => saveHistory(db, turn, nowIso));
    },
  };
}

async function loadHistory(db, nowIso) {
  const migrated = await migrate(db);
  if (!migrated.ok) {
    return { ok: false, reason: migrated.reason, messages: [] };
  }
  try {
    await purgeExpired(db, nowIso);
  } catch (error) {
    return { ok: false, reason: reasonFor(error), messages: [] };
  }
  const rows = await db.all(
    `SELECT id, role, body, response_status, created_at, amount, currency, unit,
            collected_on, product, market, validated
     FROM messages
     WHERE finalized = 1
     ORDER BY created_at ASC, position ASC`,
  );
  return { ok: true, messages: rows.map(toMessage) };
}

async function saveHistory(db, turn, nowIso) {
  const migrated = await migrate(db);
  if (!migrated.ok) {
    return migrated;
  }
  const createdAt = normalizedTimestamp(nowIso);
  const language = turn?.language === 'fon' ? 'fon' : turn?.language;
  const messages =
    language === 'fr' || language === 'fon'
      ? storedMessages(turn?.messages)
      : [];
  if (
    !createdAt ||
    (language !== 'fr' && language !== 'fon') ||
    messages.length === 0
  ) {
    return { ok: true, saved: 0 };
  }

  try {
    await transaction(db, async () => {
      await purgeExpired(db, nowIso);
      const conversationId = createId('c');
      await db.run(
        `INSERT OR IGNORE INTO conversations (id, language, created_at) VALUES (?, ?, ?)`,
        [conversationId, language, createdAt],
      );
      for (const [position, message] of messages.entries()) {
        const price = message.responseStatus === 'price' ? message.price : null;
        await db.run(
          `INSERT OR IGNORE INTO messages (
             id, conversation_id, position, role, body, language, response_status,
             created_at, finalized, amount, currency, unit, collected_on, product,
             market, validated
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
          [
            message.id,
            conversationId,
            position,
            message.role,
            message.text ?? '',
            language,
            message.responseStatus,
            createdAt,
            price?.amount ?? null,
            price?.currency ?? null,
            price?.unit ?? null,
            price?.collectedOn ?? null,
            blankToNull(price?.product),
            blankToNull(price?.market),
            price ? 1 : 0,
          ],
        );
      }
      await db.run(
        `UPDATE messages SET finalized = 1 WHERE conversation_id = ?`,
        [conversationId],
      );
    });
  } catch (error) {
    return { ok: false, reason: reasonFor(error) };
  }
  return { ok: true, saved: messages.length };
}

async function migrate(db) {
  const version = await readVersion(db);
  if (version === null || version > SCHEMA_VERSION) {
    return { ok: false, reason: 'migration' };
  }
  if (version === SCHEMA_VERSION) {
    return { ok: true };
  }
  try {
    await db.exec(CREATE_SQL);
    await db.setUserVersion(SCHEMA_VERSION);
  } catch (error) {
    return {
      ok: false,
      reason: reasonFor(error) === 'full' ? 'full' : 'migration',
    };
  }
  return { ok: true };
}

async function purgeExpired(db, nowIso) {
  const cutoff = retentionCutoff(nowIso);
  if (!cutoff) {
    return;
  }
  await db.run(
    `DELETE FROM messages
     WHERE created_at <= ?
       AND created_at GLOB ?`,
    [cutoff, ISO_TIMESTAMP],
  );
  await db.exec(
    `DELETE FROM conversations
     WHERE id NOT IN (SELECT conversation_id FROM messages)`,
  );
}

async function readVersion(db) {
  const version = Number(await db.getUserVersion());
  if (!Number.isInteger(version) || version < 0) {
    return null;
  }
  return version;
}

function storedMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.flatMap((message) => {
    const status = storedStatus(message);
    if (!status || (message.role !== 'user' && message.role !== 'assistant')) {
      return [];
    }
    const id = typeof message.id === 'string' ? message.id.trim() : '';
    if (!id) {
      return [];
    }
    return [
      {
        id,
        role: message.role,
        text: typeof message.text === 'string' ? message.text : '',
        responseStatus: status,
        price: status === 'price' ? message.price : null,
      },
    ];
  });
}

function storedStatus(message) {
  if (message?.responseStatus === 'price') {
    return canShowPrice(message.price) ? 'price' : null;
  }
  if (PERSISTED_STATUSES.has(message?.responseStatus)) {
    return message.responseStatus;
  }
  return null;
}

function toMessage(row) {
  const createdAt = /^\d{4}-\d{2}-\d{2}T/.test(row.created_at)
    ? row.created_at.slice(0, 10)
    : null;
  const price =
    row.response_status === 'price'
      ? {
          amount: row.amount ?? '',
          currency: row.currency ?? '',
          unit: row.unit ?? '',
          collectedOn: row.collected_on ?? '',
          product: row.product ?? '',
          market: row.market ?? '',
          validated: row.validated === 1,
          historical: true,
        }
      : null;
  const showPrice = price && canShowPrice(price);
  return {
    id: row.id,
    role: row.role,
    kind: showPrice ? 'price' : 'text',
    text: row.body ?? '',
    price: showPrice ? price : null,
    historical: true,
    createdAt,
    responseStatus: row.response_status,
  };
}

function normalizedTimestamp(nowIso) {
  const now = Date.parse(nowIso);
  if (Number.isNaN(now)) {
    return null;
  }
  return new Date(now).toISOString();
}

function blankToNull(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function createId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function reasonFor(error) {
  const message = String(error?.message ?? '').toLowerCase();
  if (message.includes('full') || message.includes('sqlite_full')) {
    return 'full';
  }
  return 'write';
}

async function transaction(db, work) {
  await db.exec('BEGIN IMMEDIATE');
  try {
    await work();
    await db.exec('COMMIT');
  } catch (error) {
    try {
      await db.exec('ROLLBACK');
    } catch {
      // The transaction is already closed.
    }
    throw error;
  }
}
