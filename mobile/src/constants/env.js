const SAFE_APP_ENV = /^[a-z0-9_-]{1,32}$/i;

export function readPublicConfig() {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;

  if (typeof raw === 'string' && SAFE_APP_ENV.test(raw.trim())) {
    return { appEnv: raw.trim() };
  }

  return { appEnv: 'development' };
}
