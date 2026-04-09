import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { getReadableName } from "@/lib/utils";
import {
  buildEmployeeProfile,
  getEmployeeAccountById,
} from "@/lib/server/employee-auth";
import { getEmployeeSession } from "@/lib/server/employee-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type AppUser = {
  email: string | null;
  id: string;
};

type AppSessionContext = {
  employee: Tables<"employees"> | null;
  profile: Tables<"users">;
  user: AppUser;
};

async function getEmployeeSessionContext(): Promise<AppSessionContext | null> {
  const employeeSession = await getEmployeeSession();

  if (!employeeSession) {
    return null;
  }

  const employee = await getEmployeeAccountById(employeeSession.employeeId);

  if (!employee) {
    return null;
  }

  return {
    employee,
    profile: buildEmployeeProfile(employee),
    user: {
      email: employee.email,
      id: employee.id,
    },
  };
}

async function getHrSessionContext(): Promise<AppSessionContext | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await ensureUserRecord(user);

  if (!profile) {
    return null;
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    employee: employee ?? null,
    profile,
    user: {
      email: user.email ?? null,
      id: user.id,
    },
  };
}

export async function getCurrentSession() {
  const employeeContext = await getEmployeeSessionContext();

  if (employeeContext) {
    return employeeContext;
  }

  return getHrSessionContext();
}

export async function getCurrentUser() {
  return (await getCurrentSession())?.user ?? null;
}

export async function requireUser() {
  const context = await getCurrentSession();

  if (!context) {
    redirect("/login");
  }

  return context.user;
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
  user: AppUser;
  profile: Tables<"users">;
  employee: Tables<"employees"> | null;
}> {
  const context = await getCurrentSession();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireHrProfile() {
  const context = await requireProfile();

  if (context.profile.role !== "hr") {
    redirect("/dashboard");
  }

  return context;
}

export async function requireEmployeeProfile() {
  const context = await requireProfile();

  if (context.profile.role !== "employee") {
    redirect("/dashboard");
  }

  return context;
}

export function isHrRole(profile?: Pick<Tables<"users">, "role"> | null) {
  return profile?.role === "hr";
}

export function isEmployeeRole(profile?: Pick<Tables<"users">, "role"> | null) {
  return profile?.role === "employee";
}

export function getMissingEmployeeLinkMessage() {
  return "Your employee account is not available right now. Ask HR to check your login setup.";
}

export function getUserLabel(profile: Tables<"users"> | null, email?: string | null) {
  return getReadableName(profile?.full_name, email ?? profile?.email);
}
