import {
  fireEvent,
  render,
  userEvent,
  within,
} from '@testing-library/react-native';

import ConversationScreen from '../src/screens/ConversationScreen';
import { COPY, SUGGESTION_MAIZE, SUGGESTION_RICE } from '../src/constants/copy';
import { createConversation } from '../src/services/conversation';

const validPrice = {
  validated: true,
  amount: '200',
  currency: 'XOF',
  unit: 'kg',
  collectedOn: '2026-11-20',
};

describe('ConversationScreen', () => {
  test('sends a suggestion and a typed French request without a price', async () => {
    const screen = await render(<ConversationScreen language="fr" />);
    const user = userEvent.setup();

    await user.press(screen.getByTestId('suggestion-maize'));
    expect(await screen.findByText(COPY.unavailable)).toBeTruthy();
    expect(
      within(screen.getByTestId('message-list')).getByText(SUGGESTION_MAIZE),
    ).toBeTruthy();
    expect(screen.queryByText(/XOF|FCFA/)).toBeNull();

    fireEvent.changeText(
      screen.getByTestId('draft-input'),
      'Prix du riz à Savalou',
    );
    await user.press(screen.getByTestId('send-button'));
    expect(
      within(screen.getByTestId('message-list')).getByText(SUGGESTION_RICE),
    ).toBeTruthy();
  });

  test('hides the text field in Fon and still accepts a suggestion', async () => {
    const screen = await render(<ConversationScreen language="fon" />);
    const user = userEvent.setup();

    expect(screen.queryByTestId('draft-input')).toBeNull();
    expect(screen.getByTestId('voice-button')).toBeTruthy();
    await user.press(screen.getByTestId('suggestion-rice'));
    expect(
      within(screen.getByTestId('message-list')).getByText(SUGGESTION_RICE),
    ).toBeTruthy();
    expect(screen.queryByText(/XOF|FCFA/)).toBeNull();
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

    fireEvent.changeText(
      screen.getByTestId('draft-input'),
      'Prix du maïs à Natitingou',
    );
    await user.press(screen.getByTestId('send-button'));

    expect(screen.getByText(COPY.network)).toBeTruthy();
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
      screen.getByText('Quel marché : Natitingou ou Savalou ?'),
    ).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId('draft-input'),
      'Prix du maïs à Cotonou',
    );
    await user.press(screen.getByTestId('send-button'));
    expect(screen.getByText(COPY.uncovered)).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId('draft-input'),
      'Prix du maïs à Natitingou',
    );
    await user.press(screen.getByTestId('send-button'));
    fireEvent.changeText(screen.getByTestId('draft-input'), 'Encore un prix');
    await user.press(screen.getByTestId('send-button'));

    expect(screen.getAllByText(COPY.noValidated).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('current-price')).toBeNull();
  });

  test('shows one current validated price', async () => {
    const screen = await render(
      <ConversationScreen
        language="fr"
        resolveResult={() => ({ kind: 'price', price: validPrice })}
      />,
    );

    await userEvent.setup().press(screen.getByTestId('suggestion-maize'));

    expect(screen.getByTestId('current-price')).toBeTruthy();
    expect(screen.getByText('200 XOF / kg')).toBeTruthy();
    expect(screen.getByText('2026-11-20')).toBeTruthy();
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
        onStageTranscription={() => 'Prix du riz à Savalou'}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('voice-button'));
    expect(await screen.findByText(COPY.confirmTitle)).toBeTruthy();
    await user.press(screen.getByTestId('repeat-button'));
    expect(screen.queryByText(COPY.confirmTitle)).toBeNull();

    await user.press(screen.getByTestId('voice-button'));
    await user.press(screen.getByTestId('confirm-button'));
    expect(
      within(screen.getByTestId('message-list')).getByText(SUGGESTION_RICE),
    ).toBeTruthy();
  });

  test('does not invent a transcription when voice is not connected', async () => {
    const screen = await render(<ConversationScreen language="fr" />);

    await userEvent.setup().press(screen.getByTestId('voice-button'));

    expect(screen.getByText(COPY.voicePending)).toBeTruthy();
    expect(screen.queryByTestId('current-price')).toBeNull();
  });
});
