"use server";

import { revalidatePath } from "next/cache";
import { errorResult, getActionContext, getOptionalString, successResult } from "@/lib/action-utils";
import { hashPassword } from "@/lib/server/password";
import { sql } from "@/lib/server/postgres";

export async function updateProfileAction(formData: FormData) {
  const { user, profile, employee, supabase } = await getActionContext();
  const fullName = getOptionalString(formData, "full_name");
  const phone = getOptionalString(formData, "phone");
  const email = getOptionalString(formData, "email");

  if (profile.role === "employee") {
    if (!employee) {
      return errorResult("Employee account is not available right now.");
    }

    await sql(
      `
        update public.employees
        set name = $1,
            phone = $2,
            updated_at = timezone('utc', now())
        where id = $3
      `,
      [fullName ?? employee.name, phone ?? employee.phone, employee.id],
    );

    revalidatePath("/profile");
    return successResult("Profile updated.");
  }

  const [{ error: userError }, { error: employeeError }] = await Promise.all([
    supabase
      .from("users")
      .update({ email: email ?? user.email ?? "", full_name: fullName })
      .eq("id", user.id),
    supabase.from("employees").update({ phone: phone ?? "" }).eq("user_id", user.id),
  ]);

  if (userError) {
    return errorResult(userError.message);
  }

  if (employeeError && employeeError.code !== "PGRST116") {
    return errorResult(employeeError.message);
  }

  if (email && email !== user.email) {
    const emailResult = await supabase.auth.updateUser({ email });

    if (emailResult.error) {
      return errorResult(emailResult.error.message);
    }
  }

  revalidatePath("/profile");
  return successResult(
    email && email !== user.email
      ? "Profile updated. Verify the new email from your inbox to complete the change."
      : "Profile updated.",
  );
}

export async function changePasswordAction(formData: FormData) {
  const { employee, profile, supabase } = await getActionContext();
  const password = (formData.get("password") as string | null) ?? "";

  if (password.length < 6) {
    return errorResult("Password must be at least 6 characters.");
  }

  if (profile.role === "employee") {
    if (!employee) {
      return errorResult("Employee account is not available right now.");
    }

    const passwordHash = await hashPassword(password);

    await sql(
      `
        update public.employees
        set password_hash = $1,
            updated_at = timezone('utc', now())
        where id = $2
      `,
      [passwordHash, employee.id],
    );

    return successResult("Password updated.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return errorResult(error.message);
  }

  return successResult("Password updated.");
}
