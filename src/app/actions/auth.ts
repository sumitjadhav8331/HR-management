"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { errorResult, successResult, validationError } from "@/lib/action-utils";
import { ensureUserRecord } from "@/lib/auth";
import { loginSchema, signupSchema } from "@/lib/validators";

function isEmailConfirmationError(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("email not confirmed") ||
    normalized.includes("email not verified")
  );
}

export async function loginAction(formData: FormData) {
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

export async function resendVerificationAction(formData: FormData) {
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
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return errorResult(error.message);
  }

  return successResult("Signed out successfully.");
}
