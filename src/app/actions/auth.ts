"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sql } from "@/lib/server/postgres";
import {
  createEmployeeSession,
  clearEmployeeSession,
} from "@/lib/server/employee-session";
import { findEmployeeAccountsByEmail } from "@/lib/server/employee-auth";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { errorResult, successResult, validationError } from "@/lib/action-utils";
import { ensureUserRecord } from "@/lib/auth";
import { getSupabaseEnvErrorMessage, isSupabaseConfigured } from "@/lib/env";
import { loginSchema, signupSchema } from "@/lib/validators";

function isEmailConfirmationError(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("email not confirmed") ||
    normalized.includes("email not verified")
  );
}

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return errorResult(getSupabaseEnvErrorMessage());
  }

  await clearEmployeeSession();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return validationError(parsed.error, "Please enter valid login details.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (isEmailConfirmationError(error.message)) {
      return errorResult(
        "Email not verified yet. Open the confirmation email from Supabase first, or disable Confirm email in Supabase Auth settings for development.",
      );
    }

    return errorResult(error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureUserRecord(user);
  }

  return successResult("Welcome back.", { signedIn: true });
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return errorResult(getSupabaseEnvErrorMessage());
  }

  await clearEmployeeSession();

  const parsed = signupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return validationError(parsed.error, "Please complete the signup form.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
      },
    },
  });

  if (error) {
    return errorResult(error.message);
  }

  if (data.user && data.session) {
    await ensureUserRecord(data.user);
    return successResult("HR account created successfully.", { signedIn: true });
  }

  return successResult(
    "Account created. Check your email and verify the account before signing in.",
    { signedIn: false },
  );
}

export async function employeeLoginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return validationError(parsed.error, "Please enter valid employee login details.");
  }

  const submittedEmail = parsed.data.email.trim().toLowerCase();
  await clearEmployeeSession();

  const supabase = isSupabaseConfigured()
    ? await createServerSupabaseClient()
    : null;

  if (supabase) {
    await supabase.auth.signOut();
  }

  const employeeMatches = await findEmployeeAccountsByEmail(submittedEmail);

  if (employeeMatches.length > 1) {
    return errorResult(
      "Multiple employee accounts use this email. Ask HR to fix duplicate employee emails.",
    );
  }

  const employee = employeeMatches[0];

  if (!employee) {
    return errorResult("Invalid email or password.");
  }

  if (employee.status === "left") {
    return errorResult("This employee account is inactive. Contact HR for help.");
  }

  let authenticated = await verifyPassword(parsed.data.password, employee.password_hash);

  if (!authenticated && employee.user_id && supabase) {
    const { error } = await supabase.auth.signInWithPassword({
      email: submittedEmail,
      password: parsed.data.password,
    });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id === employee.user_id) {
        authenticated = true;
        const passwordHash = await hashPassword(parsed.data.password);

        await sql(
          `
            update public.employees
            set password_hash = $1,
                updated_at = timezone('utc', now())
            where id = $2
          `,
          [passwordHash, employee.id],
        );
      }

      await supabase.auth.signOut();
    }
  }

  if (!authenticated) {
    if (!employee.password_hash && !employee.user_id) {
      return errorResult(
        "Employee login is not configured yet. Ask HR to add your email and password.",
      );
    }

    return errorResult("Invalid email or password.");
  }

  await createEmployeeSession(employee.id);

  return successResult("Welcome back.", { signedIn: true });
}

export async function resendVerificationAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return errorResult(getSupabaseEnvErrorMessage());
  }

  const parsed = loginSchema.pick({ email: true }).safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return validationError(parsed.error, "Enter a valid email address first.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
  });

  if (error) {
    return errorResult(error.message);
  }

  return successResult("Verification email sent. Check your inbox and spam folder.");
}

export async function signOutAction() {
  await clearEmployeeSession();

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return errorResult(error.message);
    }
  }

  return successResult("Signed out successfully.");
}
