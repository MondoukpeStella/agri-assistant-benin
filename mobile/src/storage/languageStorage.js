import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'agri.language';
const LANGUAGES = new Set(['fr', 'fon']);

export function isLanguage(value) {
  return LANGUAGES.has(value);
}

export async function readLanguage() {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

export async function saveLanguage(language) {
  if (!isLanguage(language)) {
    throw new Error('invalid language');
  }
  await AsyncStorage.setItem(STORAGE_KEY, language);
}
