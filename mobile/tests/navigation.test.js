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

    await user.press(await screen.findByTestId('splash-start'));
    expect(await screen.findByTestId('language-screen')).toBeTruthy();
    await user.press(screen.getByTestId('choice-fr'));
    await user.press(screen.getByTestId('language-continue'));
    expect(await screen.findByText(COPY.intro)).toBeTruthy();
    await user.press(screen.getByTestId('start-button'));
    expect(await screen.findByTestId('conversation-screen')).toBeTruthy();
    expect(screen.getByTestId('draft-input')).toBeTruthy();
    expect(saveLanguage).toHaveBeenCalledWith('fr');
  });

  test('starts in Fon without a written introduction or text field', async () => {
    const screen = await render(<RootNavigator />);
    const user = userEvent.setup();

    await user.press(await screen.findByTestId('splash-start'));
    await user.press(await screen.findByTestId('choice-fon'));
    await user.press(screen.getByTestId('language-continue'));
    expect(await screen.findByLabelText(COPY.fonIntroLabel)).toBeTruthy();
    expect(screen.queryByText(COPY.intro)).toBeNull();
    await user.press(screen.getByTestId('start-button'));
    expect(await screen.findByTestId('conversation-screen')).toBeTruthy();
    expect(screen.queryByTestId('draft-input')).toBeNull();
    expect(saveLanguage).toHaveBeenCalledWith('fon');
  });

  test('shows the saved language, then opens the conversation', async () => {
    readLanguage.mockResolvedValue('fon');
    const screen = await render(<RootNavigator />);
    const user = userEvent.setup();

    await user.press(await screen.findByTestId('splash-start'));
    expect(await screen.findByTestId('language-screen')).toBeTruthy();
    expect(
      screen.getByTestId('choice-fon').props.accessibilityState.selected,
    ).toBe(true);
    await user.press(screen.getByTestId('language-continue'));
    expect(await screen.findByTestId('conversation-screen')).toBeTruthy();
    expect(screen.queryByTestId('intro-screen')).toBeNull();
    expect(screen.queryByTestId('draft-input')).toBeNull();
  });

  test('changes the language from settings without the bottom microphone', async () => {
    const screen = await render(<RootNavigator />);
    const user = userEvent.setup();

    expect(await screen.findByTestId('splash-logo')).toBeTruthy();
    await user.press(screen.getByTestId('splash-start'));
    await user.press(screen.getByTestId('language-continue'));
    await user.press(screen.getByTestId('start-button'));
    expect(await screen.findByTestId('draft-input')).toBeTruthy();
    expect(screen.getAllByTestId('voice-button')).toHaveLength(1);

    expect(screen.queryByTestId('history-button')).toBeNull();
    await user.press(screen.getByTestId('settings-button'));
    expect(screen.getByText(COPY.settingsHistory)).toBeTruthy();
    await user.press(screen.getByTestId('open-history'));
    expect(screen.getByTestId('history-screen')).toBeTruthy();
    await user.press(screen.getByTestId('settings-button'));
    await user.press(screen.getByTestId('open-language'));
    await user.press(screen.getByTestId('settings-fon'));
    await user.press(screen.getByTestId('settings-save'));

    expect(screen.queryByTestId('settings-screen')).toBeNull();
    expect(screen.queryByText(COPY.greeting)).toBeNull();
    expect(screen.queryByText(COPY.voicePending)).toBeNull();
    expect(screen.queryByTestId('draft-input')).toBeNull();
    expect(screen.queryByTestId('composer')).toBeNull();
    expect(screen.getByTestId('voice-button')).toBeTruthy();
    expect(saveLanguage).toHaveBeenLastCalledWith('fon');
  });

  test('stays on language choice when storage cannot save', async () => {
    saveLanguage.mockRejectedValue(new Error('full'));
    const screen = await render(<RootNavigator />);

    await userEvent.setup().press(await screen.findByTestId('splash-start'));
    await userEvent.setup().press(screen.getByTestId('language-continue'));

    expect(screen.getByTestId('language-screen')).toBeTruthy();
    expect(screen.queryByTestId('intro-screen')).toBeNull();
  });
});
