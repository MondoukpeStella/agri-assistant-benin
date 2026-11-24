const SAFE_APP_ENV = /^[a-z0-9_-]{1,32}$/i;

export function readPublicConfig() {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  const appEnv =
    typeof raw === 'string' && SAFE_APP_ENV.test(raw.trim())
      ? raw.trim()
      : 'development';

  return { appEnv, apiUrl: readApiUrl() };
}

function readApiUrl() {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  if (typeof raw !== 'string') {
    return '';
  }
  const value = raw.trim().replace(/\/$/, '');
  return /^https?:\/\/\S+$/.test(value) ? value : '';
}
