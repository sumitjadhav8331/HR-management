import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { getReadableName } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function ensureUserRecord(user: User) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null,
      role:
        user.user_metadata?.role === "employee"
          ? "employee"
          : "hr",
    },
    { onConflict: "id" },
  );

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

export async function requireProfile(): Promise<{
  user: User;
  profile: Tables<"users"> | null;
}> {
  const user = await requireUser();
  const profile = await ensureUserRecord(user);

  return { user, profile };
}

export function getUserLabel(profile: Tables<"users"> | null, email?: string | null) {
  return getReadableName(profile?.full_name, email ?? profile?.email);
}
