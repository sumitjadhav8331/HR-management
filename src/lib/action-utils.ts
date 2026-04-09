import { ZodError } from "zod";
import { requireProfile } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

export async function getActionContext() {
  const { user, profile, employee } = await requireProfile();
  const supabase = await createServerSupabaseClient();

  return { user, profile, employee, supabase };
}

export function toFieldErrors(error: ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

export function validationError(
  error: ZodError,
  message = "Please fix the highlighted fields and try again.",
): ActionResult {
  return {
    success: false,
    message,
    fieldErrors: toFieldErrors(error),
  };
}

export function successResult<T = undefined>(
  message: string,
  data?: T,
): ActionResult<T> {
  return { success: true, message, data };
}

export function errorResult(message: string): ActionResult {
  return { success: false, message };
}

export function requireHrAction(profile: Pick<Tables<"users">, "role">) {
  return profile.role === "hr"
    ? null
    : errorResult("Only HR accounts can perform this action.");
}

export function requireEmployeeLinkAction(employee: Tables<"employees"> | null) {
  return employee
    ? null
    : errorResult(
        "Your login is not linked to an employee profile yet. Ask HR to finish your account setup.",
      );
}

export function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  return value.length > 0 ? value : null;
}

export function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

export function calculateTotalHours(loginTime: string, logoutTime?: string | null) {
  if (!logoutTime) {
    return null;
  }

  const diffInMilliseconds =
    new Date(logoutTime).getTime() - new Date(loginTime).getTime();

  if (!Number.isFinite(diffInMilliseconds) || diffInMilliseconds <= 0) {
    return null;
  }

  return Number((diffInMilliseconds / 3_600_000).toFixed(2));
}
