import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { assertSupabaseEnv, env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export async function createServerSupabaseClient() {
  assertSupabaseEnv();

  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie writes from a Server Component are intentionally ignored.
        }
      },
    },
  });
}
