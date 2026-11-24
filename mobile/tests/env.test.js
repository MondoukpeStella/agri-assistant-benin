import { readPublicConfig } from '../src/constants/env';

const ORIGINAL_APP_ENV = process.env.EXPO_PUBLIC_APP_ENV;

afterEach(() => {
  if (ORIGINAL_APP_ENV === undefined) {
    delete process.env.EXPO_PUBLIC_APP_ENV;
  } else {
    process.env.EXPO_PUBLIC_APP_ENV = ORIGINAL_APP_ENV;
  }
});

describe('readPublicConfig', () => {
  test('uses development when the optional variable is absent', () => {
    delete process.env.EXPO_PUBLIC_APP_ENV;

    expect(readPublicConfig()).toEqual({
      appEnv: 'development',
      apiUrl: '',
    });
  });

  test('uses development when the optional variable is empty', () => {
    process.env.EXPO_PUBLIC_APP_ENV = '   ';

    expect(readPublicConfig()).toEqual({
      appEnv: 'development',
      apiUrl: '',
    });
  });

  test('accepts a short public environment name', () => {
    process.env.EXPO_PUBLIC_APP_ENV = ' staging ';

    expect(readPublicConfig()).toEqual({ appEnv: 'staging', apiUrl: '' });
  });

  test('ignores a value that could carry unexpected content', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'prod secret token';

    expect(readPublicConfig()).toEqual({
      appEnv: 'development',
      apiUrl: '',
    });
  });

  test('keeps only an http address for the local API', () => {
    process.env.EXPO_PUBLIC_API_URL = ' http://127.0.0.1:8000/ ';

    expect(readPublicConfig().apiUrl).toBe('http://127.0.0.1:8000');

    process.env.EXPO_PUBLIC_API_URL = 'not a url';
    expect(readPublicConfig().apiUrl).toBe('');
    delete process.env.EXPO_PUBLIC_API_URL;
  });
});
