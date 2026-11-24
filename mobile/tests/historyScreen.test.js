import { DatabaseSync } from 'node:sqlite';
import {
  fireEvent,
  render,
  userEvent,
  waitFor,
} from '@testing-library/react-native';

import { COPY, SUGGESTION_MAIZE } from '../src/constants/copy';
import ConversationScreen from '../src/screens/ConversationScreen';
import { createHistoryRepository } from '../src/storage/historyRepository';

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
      db.exec(`PRAGMA user_version = ${Number(version)}`);
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

describe('conversation history on screen', () => {
  test('stores a price consultation from the conversation', async () => {
    const store = createHistoryRepository(openNodeDatabase());
    const screen = await render(
      <ConversationScreen
        historyStore={store}
        language="fr"
        resolveResult={async () => ({ kind: 'price', price })}
      />,
    );

    await userEvent.setup().press(screen.getByTestId('suggestion-maize'));
    expect(
      await screen.findByTestId('current-price', {}, { timeout: 3000 }),
    ).toBeTruthy();
    await waitFor(async () => {
      const stored = await store.load(new Date().toISOString());
      expect(stored.messages.some((message) => message.kind === 'price')).toBe(
        true,
      );
    });
  });

  test('shows a stored price as history when the conversation opens again', async () => {
    const store = createHistoryRepository(openNodeDatabase());
    await store.save(
      {
        language: 'fr',
        messages: [
          {
            id: 'question',
            role: 'user',
            text: SUGGESTION_MAIZE,
            responseStatus: 'question',
          },
          {
            id: 'answer',
            role: 'assistant',
            text: '',
            responseStatus: 'price',
            price,
          },
        ],
      },
      '2026-11-22T12:00:00.000Z',
    );
    const screen = await render(
      <ConversationScreen historyStore={store} language="fr" />,
    );
    const user = userEvent.setup();

    expect(await screen.findByTestId('historical-price')).toBeTruthy();
    expect(screen.queryByTestId('current-price')).toBeNull();
    await user.press(screen.getByTestId('settings-button'));
    await user.press(await screen.findByTestId('open-history'));
    expect(screen.getByText(SUGGESTION_MAIZE)).toBeTruthy();
  });

  test('does not keep the offline refusal as a stored price', async () => {
    const store = createHistoryRepository(openNodeDatabase());
    await store.save(
      {
        language: 'fr',
        messages: [
          {
            id: 'old',
            role: 'user',
            text: 'Ancienne question',
            responseStatus: 'question',
          },
        ],
      },
      '2026-11-21T12:00:00.000Z',
    );
    const screen = await render(
      <ConversationScreen
        historyStore={store}
        language="fr"
        resolveResult={async () => ({ kind: 'networkError' })}
      />,
    );
    const user = userEvent.setup();

    expect(await screen.findByText('Ancienne question')).toBeTruthy();
    fireEvent.changeText(
      screen.getByTestId('draft-input'),
      'Prix du riz à Savalou ?',
    );
    await user.press(screen.getByTestId('send-button'));

    expect(
      await screen.findByText(COPY.network, {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.queryByTestId('current-price')).toBeNull();
    expect(screen.queryByTestId('historical-price')).toBeNull();
    await user.press(screen.getByTestId('settings-button'));
    await user.press(screen.getByTestId('open-history'));
    expect(screen.getByText('Ancienne question')).toBeTruthy();

    const stored = await store.load('2026-11-22T12:00:00.000Z');
    expect(stored.messages.map((message) => message.text)).toEqual([
      'Ancienne question',
    ]);
  });

  test('stores a published price question and keeps it out of the history list', async () => {
    const store = createHistoryRepository(openNodeDatabase());
    const screen = await render(
      <ConversationScreen historyStore={store} language="fr" />,
    );

    await userEvent.setup().press(screen.getByTestId('suggestion-maize'));
    expect(
      await screen.findByText('Maïs blanc · Natitingou', {}, { timeout: 3000 }),
    ).toBeTruthy();

    const stored = await store.load(new Date().toISOString());
    expect(
      stored.messages.some((message) => message.text === SUGGESTION_MAIZE),
    ).toBe(true);
    await userEvent.setup().press(screen.getByTestId('settings-button'));
    await userEvent.setup().press(screen.getByTestId('open-history'));
    expect(screen.getByText(COPY.historyEmpty)).toBeTruthy();
  });

  test('stays open when local storage is full or the schema cannot be read', async () => {
    const screen = await render(
      <ConversationScreen
        historyStore={{
          load: async () => ({ ok: false, reason: 'migration', messages: [] }),
          save: async () => ({ ok: false, reason: 'full' }),
        }}
        language="fr"
        resolveResult={async () => ({ kind: 'price', price })}
      />,
    );
    const user = userEvent.setup();

    expect(screen.getByTestId('draft-input')).toBeTruthy();
    await user.press(screen.getByTestId('settings-button'));
    await user.press(screen.getByTestId('open-history'));
    expect(await screen.findByText(COPY.historyUnavailable)).toBeTruthy();
    await user.press(screen.getByTestId('settings-button'));
    await user.press(screen.getByTestId('settings-button'));
    await user.press(screen.getByTestId('suggestion-maize'));
    expect(
      await screen.findByTestId('current-price', {}, { timeout: 3000 }),
    ).toBeTruthy();
    await user.press(screen.getByTestId('settings-button'));
    await user.press(screen.getByTestId('open-history'));
    expect(await screen.findByText(COPY.historyStorageFull)).toBeTruthy();
  });
});
