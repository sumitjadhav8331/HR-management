export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function getSupabaseEnvErrorMessage() {
  return "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the Next.js server.";
}

export function assertSupabaseEnv() {
  if (!isSupabaseConfigured()) {
    throw new Error(getSupabaseEnvErrorMessage());
  }
}
