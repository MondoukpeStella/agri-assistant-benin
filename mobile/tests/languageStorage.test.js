import AsyncStorage from '@react-native-async-storage/async-storage';

import { readLanguage, saveLanguage } from '../src/storage/languageStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('language storage', () => {
  test('returns null when nothing is stored', async () => {
    expect(await readLanguage()).toBeNull();
  });

  test('saves and reads French and Fon', async () => {
    await saveLanguage('fr');
    expect(await readLanguage()).toBe('fr');

    await saveLanguage('fon');
    expect(await readLanguage()).toBe('fon');
  });

  test('treats an unknown stored value as a new launch', async () => {
    await AsyncStorage.setItem('agri.language', 'en');

    expect(await readLanguage()).toBeNull();
  });

  test('returns null when storage cannot be read', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(
      new Error('storage unavailable'),
    );

    expect(await readLanguage()).toBeNull();
  });

  test('refuses to save an unknown language', async () => {
    await expect(saveLanguage('en')).rejects.toThrow('invalid language');
  });
});
