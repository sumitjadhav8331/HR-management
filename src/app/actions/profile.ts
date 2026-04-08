"use server";

import { revalidatePath } from "next/cache";
import { errorResult, getActionContext, getOptionalString, successResult } from "@/lib/action-utils";

export async function updateProfileAction(formData: FormData) {
  const { user, supabase } = await getActionContext();
  const fullName = getOptionalString(formData, "full_name");
  const phone = getOptionalString(formData, "phone");

  const [{ error: userError }, { error: employeeError }] = await Promise.all([
    supabase.from("users").update({ full_name: fullName }).eq("id", user.id),
    supabase.from("employees").update({ phone: phone ?? "" }).eq("user_id", user.id),
  ]);

  if (userError) {
    return errorResult(userError.message);
  }

  if (employeeError && employeeError.code !== "PGRST116") {
    return errorResult(employeeError.message);
  }

  revalidatePath("/profile");
  return successResult("Profile updated.");
}

export async function changePasswordAction(formData: FormData) {
  const { supabase } = await getActionContext();
  const password = (formData.get("password") as string | null) ?? "";

  if (password.length < 6) {
    return errorResult("Password must be at least 6 characters.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return errorResult(error.message);
  }

  return successResult("Password updated.");
}
