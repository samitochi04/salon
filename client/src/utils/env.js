function requiredEnv(key) {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export const env = {
  apiBaseUrl,
  supabaseUrl: requiredEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: requiredEnv('VITE_SUPABASE_ANON_KEY'),
};
