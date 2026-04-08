import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<Database> | undefined;

export function createBrowserSupabaseClient() {
  assertSupabaseEnv();

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      env.supabaseUrl!,
      env.supabaseAnonKey!,
    );
  }

  return browserClient;
}
