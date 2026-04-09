function getFirstEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

export const env = {
  supabaseUrl: getFirstEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getFirstEnvValue(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ),
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function getSupabaseEnvErrorMessage() {
  return "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) to your environment, then restart or redeploy the Next.js app.";
}

export function assertSupabaseEnv() {
  if (!isSupabaseConfigured()) {
    throw new Error(getSupabaseEnvErrorMessage());
  }
}
