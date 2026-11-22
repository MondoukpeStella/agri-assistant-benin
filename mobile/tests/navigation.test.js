import { cleanup, render, userEvent } from '@testing-library/react-native';

import { COPY } from '../src/constants/copy';
import RootNavigator from '../src/navigation/RootNavigator';
import { readLanguage, saveLanguage } from '../src/storage/languageStorage';

jest.mock('../src/storage/languageStorage', () => ({
  readLanguage: jest.fn(),
  saveLanguage: jest.fn(),
}));

beforeEach(async () => {
  await cleanup();
  readLanguage.mockReset();
  saveLanguage.mockReset();
  readLanguage.mockResolvedValue(null);
  saveLanguage.mockResolvedValue(undefined);
});

describe('first launch and language restoration', () => {
  test('starts in French from the language choice through the conversation', async () => {
    const screen = await render(<RootNavigator />);
    const user = userEvent.setup();

    expect(await screen.findByTestId('language-screen')).toBeTruthy();
    await user.press(screen.getByTestId('choice-fr'));
    expect(await screen.findByText(COPY.intro)).toBeTruthy();
    await user.press(screen.getByTestId('start-button'));
    expect(await screen.findByTestId('conversation-screen')).toBeTruthy();
    expect(screen.getByTestId('draft-input')).toBeTruthy();
    expect(saveLanguage).toHaveBeenCalledWith('fr');
  });

  test('starts in Fon without a written introduction or text field', async () => {
    const screen = await render(<RootNavigator />);
    const user = userEvent.setup();

    await user.press(await screen.findByTestId('choice-fon'));
    expect(await screen.findByLabelText(COPY.fonIntroLabel)).toBeTruthy();
    expect(screen.queryByText(COPY.intro)).toBeNull();
    await user.press(screen.getByTestId('start-button'));
    expect(await screen.findByTestId('conversation-screen')).toBeTruthy();
    expect(screen.queryByTestId('draft-input')).toBeNull();
    expect(saveLanguage).toHaveBeenCalledWith('fon');
  });

  test('opens the conversation directly when a language is already stored', async () => {
    readLanguage.mockResolvedValue('fon');
    const screen = await render(<RootNavigator />);

    expect(await screen.findByTestId('conversation-screen')).toBeTruthy();
    expect(screen.queryByTestId('language-screen')).toBeNull();
    expect(screen.queryByTestId('draft-input')).toBeNull();
  });

  test('stays on language choice when storage cannot save', async () => {
    saveLanguage.mockRejectedValue(new Error('full'));
    const screen = await render(<RootNavigator />);

    await userEvent.setup().press(await screen.findByTestId('choice-fr'));

    expect(screen.getByTestId('language-screen')).toBeTruthy();
    expect(screen.queryByTestId('intro-screen')).toBeNull();
  });
});
