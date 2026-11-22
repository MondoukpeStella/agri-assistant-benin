import { render } from '@testing-library/react-native';

import RootNavigator from '../src/navigation/RootNavigator';
import StartupScreen from '../src/screens/StartupScreen';
import {
  APP_NAME,
  STARTUP_BACKEND_NOTE,
  STARTUP_MESSAGE,
  STARTUP_TITLE,
} from '../src/constants/startupCopy';

describe('StartupScreen', () => {
  const ORIGINAL_APP_ENV = process.env.EXPO_PUBLIC_APP_ENV;

  afterEach(() => {
    if (ORIGINAL_APP_ENV === undefined) {
      delete process.env.EXPO_PUBLIC_APP_ENV;
    } else {
      process.env.EXPO_PUBLIC_APP_ENV = ORIGINAL_APP_ENV;
    }
  });

  test('renders the technical screen without a price', async () => {
    delete process.env.EXPO_PUBLIC_APP_ENV;

    const screen = await render(<StartupScreen />);

    expect(screen.getByText(APP_NAME)).toBeTruthy();
    expect(screen.getByText(STARTUP_TITLE)).toBeTruthy();
    expect(screen.getByText(STARTUP_MESSAGE)).toBeTruthy();
    expect(screen.getByText(STARTUP_BACKEND_NOTE)).toBeTruthy();
    expect(screen.getByText('Configuration : development')).toBeTruthy();
    expect(screen.queryByText(/FCFA|XOF/)).toBeNull();
    expect(screen.queryByText(/\d[\d\s.,]*\s*(FCFA|XOF|kg)/i)).toBeNull();
  });

  test('starts from the root navigator', async () => {
    const screen = await render(<RootNavigator />);

    expect(screen.getByTestId('startup-screen')).toBeTruthy();
    expect(screen.getByText(STARTUP_MESSAGE)).toBeTruthy();
  });
});
