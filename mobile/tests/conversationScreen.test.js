import { useAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import {
  fireEvent,
  render,
  userEvent,
  waitFor,
  within,
} from '@testing-library/react-native';

import ConversationScreen from '../src/screens/ConversationScreen';
import { COPY, SUGGESTION_MAIZE, SUGGESTION_RICE } from '../src/constants/copy';
import { createConversation } from '../src/services/conversation';

const mockHeard = { text: '' };

jest.mock('../src/services/frenchRecorder', () => ({
  startFrenchRecording: jest.fn(async () => false),
  stopFrenchRecording: jest.fn(async () => mockHeard.text),
}));

const validPrice = {
  validated: true,
  amount: '200',
  currency: 'XOF',
  unit: 'kg',
  collectedOn: '2026-11-20',
};

describe('ConversationScreen', () => {
  test('keeps the crop when the market arrives in the next message', async () => {
    const screen = await render(<ConversationScreen language="fr" />);
    const user = userEvent.setup();

    fireEvent.changeText(
      screen.getByTestId('draft-input'),
      'Quel est le prix du maïs ?',
    );
    await user.press(screen.getByTestId('send-button'));
    expect(
      await screen.findByText(
        COPY.clarificationFallback,
        {},
        { timeout: 3000 },
      ),
    ).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('draft-input'), 'Natitingou');
    await user.press(screen.getByTestId('send-button'));

    expect(
      await screen.findByText('Maïs blanc · Natitingou', {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.getByText('165 XOF/KG')).toBeTruthy();
    expect(screen.getByText(COPY.priceIntro)).toBeTruthy();
    expect(screen.queryByText(/Précisez le produit/)).toBeNull();
    expect(screen.queryByText(/Données fictives|250|FCFA/)).toBeNull();
  }, 15000);

  test('sends a suggestion and a typed French request without a price', async () => {
    Speech.speak.mockClear();
    const screen = await render(<ConversationScreen language="fr" />);
    const user = userEvent.setup();

    const searching = user.press(screen.getByTestId('suggestion-maize'));
    expect(await screen.findByText(COPY.loading)).toBeTruthy();
    expect(
      await screen.findByText('Maïs blanc · Natitingou', {}, { timeout: 3000 }),
    ).toBeTruthy();
    await searching;
    expect(screen.getByText('165 XOF/KG')).toBeTruthy();
    expect(screen.getAllByText(/2026-10-15/).length).toBeGreaterThan(0);
    expect(screen.getByText(COPY.notCurrentPrice)).toBeTruthy();
    expect(screen.getByText(COPY.priceIntro)).toBeTruthy();
    expect(screen.getAllByTestId('published-price').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('current-price')).toBeNull();
    expect(Speech.speak).not.toHaveBeenCalled();
    expect(
      within(screen.getByTestId('message-list')).getByText(SUGGESTION_MAIZE),
    ).toBeTruthy();
    expect(screen.queryByText(/250|FCFA|Données fictives/)).toBeNull();

    fireEvent.changeText(screen.getByTestId('draft-input'), SUGGESTION_RICE);
    await user.press(screen.getByTestId('send-button'));
    expect(
      within(screen.getByTestId('message-list')).getByText(SUGGESTION_RICE),
    ).toBeTruthy();
    expect(screen.getByTestId('draft-input').props.value).toBe('');
  });

  test('explains Fon mode in French and keeps the microphone', async () => {
    const player = useAudioPlayer();
    player.play.mockClear();
    player.seekTo.mockClear();
    const screen = await render(<ConversationScreen language="fon" />);
    const user = userEvent.setup();

    expect(screen.queryByTestId('draft-input')).toBeNull();
    expect(screen.queryByTestId('composer')).toBeNull();
    expect(screen.queryByTestId('suggestion-rice')).toBeNull();
    expect(screen.queryByText(COPY.greeting)).toBeNull();
    expect(screen.queryByText(COPY.voicePending)).toBeNull();
    expect(screen.getByText(COPY.fonGuideTitle)).toBeTruthy();
    expect(screen.getByText(COPY.fonGuideStep1)).toBeTruthy();
    expect(screen.getByText(COPY.fonGuideStep2)).toBeTruthy();
    expect(screen.getByText(COPY.fonGuideStep3)).toBeTruthy();
    expect(screen.getByText(COPY.fonGuideLimit)).toBeTruthy();
    expect(screen.getByText(COPY.fonListen)).toBeTruthy();
    expect(player.play).toHaveBeenCalled();
    await user.press(screen.getByTestId('fon-intro-button'));
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(screen.getByTestId('voice-button')).toBeTruthy();
  });

  test('clears the conversation when the language changes', async () => {
    const kept = [
      {
        id: 'old',
        role: 'user',
        kind: 'text',
        text: SUGGESTION_MAIZE,
        historical: true,
        createdAt: '2026-11-01',
        responseStatus: 'question',
      },
    ];
    const store = {
      load: async () => ({ ok: true, messages: [...kept] }),
      save: async () => ({ ok: true, saved: 0 }),
      clear: async () => {
        kept.length = 0;
        return { ok: true };
      },
    };
    const screen = await render(
      <ConversationScreen
        language="fr"
        historyStore={store}
        initialState={createConversation([...kept])}
        onChangeLanguage={async () => true}
      />,
    );
    const user = userEvent.setup();

    expect(screen.getByText(SUGGESTION_MAIZE)).toBeTruthy();
    await user.press(screen.getByTestId('settings-button'));
    await user.press(screen.getByTestId('open-language'));
    await user.press(screen.getByTestId('settings-fon'));
    await user.press(screen.getByTestId('settings-save'));

    expect(screen.queryByText(SUGGESTION_MAIZE)).toBeNull();
    await waitFor(() => {
      expect(kept).toHaveLength(0);
    });
    await user.press(screen.getByTestId('settings-button'));
    await user.press(screen.getByTestId('open-history'));
    expect(screen.getByText(COPY.historyEmpty)).toBeTruthy();
  });

  test('keeps a long message inside the scrolling conversation', async () => {
    const screen = await render(<ConversationScreen language="fr" />);
    const user = userEvent.setup();
    const longText = `Prix du maïs ${'très '.repeat(40)}détaillé`;

    fireEvent.changeText(screen.getByTestId('draft-input'), longText);
    await user.press(screen.getByTestId('send-button'));

    expect(screen.getByTestId('message-scroll')).toBeTruthy();
    expect(screen.getByTestId('composer')).toBeTruthy();
    expect(screen.getByText(longText)).toBeTruthy();
  });

  test('does not send again while a request is already sending', async () => {
    const screen = await render(
      <ConversationScreen
        language="fr"
        initialState={{
          ...createConversation(),
          phase: 'sending',
          pendingText: SUGGESTION_MAIZE,
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('send-button'));
    await user.press(screen.getByTestId('suggestion-rice'));

    expect(
      within(screen.getByTestId('message-list')).queryByText(SUGGESTION_RICE),
    ).toBeNull();
    expect(screen.getByText(COPY.loading)).toBeTruthy();
  });

  test('keeps the draft and offers a retry when the network fails', async () => {
    const screen = await render(
      <ConversationScreen
        language="fr"
        resolveResult={() => ({ kind: 'networkError' })}
      />,
    );
    const user = userEvent.setup();

    fireEvent.changeText(screen.getByTestId('draft-input'), SUGGESTION_MAIZE);
    await user.press(screen.getByTestId('send-button'));

    expect(
      await screen.findByText(COPY.network, {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.getByTestId('draft-input').props.value).toBe(
      SUGGESTION_MAIZE,
    );
    expect(screen.getByTestId('retry-button')).toBeTruthy();
    expect(screen.queryByTestId('current-price')).toBeNull();
  });

  test('shows a clarification, an uncovered market, and no empty price card', async () => {
    const responses = [
      { kind: 'clarification', text: 'Quel marché : Natitingou ou Savalou ?' },
      { kind: 'marketUncovered' },
      { kind: 'noValidatedData' },
      { kind: 'price', price: { ...validPrice, currency: '' } },
    ];
    const screen = await render(
      <ConversationScreen
        language="fr"
        resolveResult={() => responses.shift()}
      />,
    );
    const user = userEvent.setup();

    await user.press(screen.getByTestId('suggestion-rice'));
    expect(
      await screen.findByText(
        'Quel marché : Natitingou ou Savalou ?',
        {},
        { timeout: 3000 },
      ),
    ).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId('draft-input'),
      'Prix du maïs à Cotonou',
    );
    await user.press(screen.getByTestId('send-button'));
    expect(
      await screen.findByText(COPY.uncovered, {}, { timeout: 3000 }),
    ).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId('draft-input'),
      'Prix du maïs à Natitingou',
    );
    await user.press(screen.getByTestId('send-button'));
    expect(
      await screen.findByText(COPY.noValidated, {}, { timeout: 3000 }),
    ).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('draft-input'), 'Encore un prix');
    await user.press(screen.getByTestId('send-button'));

    await waitFor(
      () => {
        expect(screen.getAllByText(COPY.noValidated)).toHaveLength(2);
      },
      { timeout: 3000 },
    );
    expect(screen.queryByTestId('current-price')).toBeNull();
  }, 12000);

  test('shows one current validated price', async () => {
    const screen = await render(
      <ConversationScreen
        language="fr"
        resolveResult={() => ({ kind: 'price', price: validPrice })}
      />,
    );

    await userEvent.setup().press(screen.getByTestId('suggestion-maize'));

    expect(
      await screen.findByTestId('current-price', {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.getByText('200 XOF/kg')).toBeTruthy();
    expect(screen.getByText('Date de collecte : 2026-11-20')).toBeTruthy();
    expect(screen.getAllByTestId('current-price')).toHaveLength(1);
    expect(screen.queryByText(/250|FCFA|Données fictives/)).toBeNull();

    await userEvent.setup().press(screen.getByTestId('listen-button'));
    expect(screen.queryByText(COPY.listenPending)).toBeNull();
    expect(screen.getAllByTestId('current-price')).toHaveLength(1);
  });

  test('marks a previous price as historical', async () => {
    const screen = await render(
      <ConversationScreen
        language="fr"
        initialState={createConversation([
          {
            id: 'old',
            role: 'assistant',
            kind: 'price',
            text: '',
            historical: true,
            createdAt: '2026-11-01',
            price: { ...validPrice, historical: true },
          },
        ])}
      />,
    );

    expect(screen.getByTestId('message-historical')).toBeTruthy();
    expect(screen.getByTestId('historical-price')).toBeTruthy();
    expect(screen.getByText('Historique · 2026-11-01')).toBeTruthy();
    expect(screen.queryByTestId('current-price')).toBeNull();
  });

  test('asks for confirmation before sending an uncertain transcription', async () => {
    const screen = await render(
      <ConversationScreen
        language="fon"
        onStageTranscription={() => SUGGESTION_RICE}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('voice-button'));
    expect(await screen.findByText(COPY.voiceListening)).toBeTruthy();
    await user.press(screen.getByTestId('voice-stop'));
    expect(
      await screen.findByText(COPY.confirmTitle, {}, { timeout: 2000 }),
    ).toBeTruthy();
    await user.press(screen.getByTestId('repeat-button'));
    expect(screen.queryByText(COPY.confirmTitle)).toBeNull();

    await user.press(screen.getByTestId('voice-button'));
    await user.press(screen.getByTestId('voice-stop'));
    expect(
      await screen.findByText(COPY.confirmTitle, {}, { timeout: 2000 }),
    ).toBeTruthy();
    await user.press(screen.getByTestId('confirm-button'));
    expect(
      within(screen.getByTestId('message-list')).getByText(SUGGESTION_RICE),
    ).toBeTruthy();
  });

  test('writes the spoken question before the answer', async () => {
    mockHeard.text = SUGGESTION_MAIZE;
    Speech.speak.mockClear();
    const screen = await render(<ConversationScreen language="fr" />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('voice-button'));
    await user.press(screen.getByTestId('voice-stop'));

    expect(
      await screen.findByText(SUGGESTION_MAIZE, {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(
      await screen.findByText('165 XOF/KG', {}, { timeout: 4000 }),
    ).toBeTruthy();
    const messages = screen.getAllByTestId('message-current');
    expect(within(messages[0]).getByText(SUGGESTION_MAIZE)).toBeTruthy();
    expect(within(messages[1]).getByText(COPY.priceIntro)).toBeTruthy();
    expect(within(messages[1]).getByText('165 XOF/KG')).toBeTruthy();
    expect(screen.queryByText(/250|FCFA|Données fictives/)).toBeNull();
    mockHeard.text = '';
  });

  test('does not invent a transcription when voice is not connected', async () => {
    mockHeard.text = '';
    const screen = await render(<ConversationScreen language="fr" />);

    const user = userEvent.setup();
    Speech.speak.mockClear();
    await user.press(screen.getByTestId('voice-button'));
    expect(screen.getByText(COPY.voiceListening)).toBeTruthy();
    expect(screen.getAllByTestId('mic-halo')).toHaveLength(3);
    await user.press(screen.getByTestId('voice-stop'));

    expect(await screen.findByText(COPY.voiceProcessing)).toBeTruthy();
    expect(await screen.findByText(COPY.notUnderstood)).toBeTruthy();
    expect(Speech.speak).toHaveBeenCalledWith(COPY.notUnderstood, {
      language: 'fr-FR',
    });
    expect(screen.queryByText(COPY.voicePending)).toBeNull();
    expect(screen.queryByText(/«/)).toBeNull();
    expect(screen.queryByTestId('current-price')).toBeNull();
    expect(screen.queryByText(/250|FCFA/)).toBeNull();
  });

  test('speaks a microphone answer and stays silent for typed text', async () => {
    mockHeard.text = SUGGESTION_MAIZE;
    Speech.speak.mockClear();
    const user = userEvent.setup();
    const screen = await render(
      <ConversationScreen
        language="fr"
        resolveResult={async () => ({ kind: 'noValidatedData', speak: true })}
      />,
    );

    await user.press(screen.getByTestId('voice-button'));
    await user.press(screen.getByTestId('voice-stop'));
    expect(
      await screen.findByText(COPY.noValidated, {}, { timeout: 4000 }),
    ).toBeTruthy();
    expect(Speech.speak).toHaveBeenCalledWith(COPY.noValidated, {
      language: 'fr-FR',
    });

    Speech.speak.mockClear();
    await user.press(screen.getByTestId('suggestion-rice'));
    expect(Speech.speak).not.toHaveBeenCalled();
    mockHeard.text = '';
  });

  test('does not speak an invented amount', async () => {
    Speech.speak.mockClear();
    const screen = await render(
      <ConversationScreen
        language="fr"
        resolveResult={async () => ({
          kind: 'clarification',
          speak: true,
          text: 'Le prix est 250 FCFA',
        })}
      />,
    );

    await userEvent.setup().press(screen.getByTestId('suggestion-rice'));

    expect(
      await screen.findByText(COPY.noValidated, {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.queryByText(/250|FCFA|Données fictives/)).toBeNull();
    expect(Speech.speak).not.toHaveBeenCalled();
  });
});
