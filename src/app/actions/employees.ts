"use server";

import { revalidatePath } from "next/cache";
import {
  errorResult,
  getActionContext,
  getOptionalString,
  requireHrAction,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { hashPassword } from "@/lib/server/password";
import { sql } from "@/lib/server/postgres";
import { employeeSchema } from "@/lib/validators";

function isMissingEmployeeColumnError(message: string) {
  return (
    message.includes("Could not find the 'department' column") ||
    message.includes("Could not find the 'salary' column") ||
    message.includes("Could not find the 'password_hash' column")
  );
}

export async function saveEmployeeAction(formData: FormData) {
  const id = getString(formData, "id");
  const parsed = employeeSchema.safeParse({
    name: getString(formData, "name"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    role: getString(formData, "role"),
    department: getString(formData, "department"),
    salary: getString(formData, "salary"),
    joining_date: getString(formData, "joining_date"),
    status: getString(formData, "status"),
    password: getString(formData, "password") || undefined,
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { profile, supabase, user } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const existingEmployeeResult = id
    ? await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .eq("created_by", user.id)
        .maybeSingle()
    : { data: null, error: null };

  if (existingEmployeeResult.error) {
    return errorResult(existingEmployeeResult.error.message);
  }

  if (id && !existingEmployeeResult.data) {
    return errorResult("Employee not found.");
  }

  const normalizedEmail = getOptionalString(formData, "email")?.toLowerCase() ?? null;

  if (normalizedEmail) {
    const duplicateEmailResult = await sql<{ id: string }>(
      `
        select id
        from public.employees
        where lower(email) = lower($1)
          and ($2::uuid is null or id <> $2::uuid)
        limit 1
      `,
      [normalizedEmail, id || null],
    );

    if (duplicateEmailResult.rows[0]) {
      return errorResult("Another employee already uses this email. Use a different employee email.");
    }
  }

  const passwordHash = parsed.data.password
    ? await hashPassword(parsed.data.password)
    : normalizedEmail
      ? existingEmployeeResult.data?.password_hash ?? null
      : null;

  const payload = {
    name: parsed.data.name,
    phone: parsed.data.phone,
    role: parsed.data.role,
    department: parsed.data.department,
    salary: parsed.data.salary,
    joining_date: parsed.data.joining_date,
    status: parsed.data.status,
    email: normalizedEmail,
    password_hash: passwordHash,
  };

  let { error } = id
    ? await supabase
        .from("employees")
        .update(payload)
        .eq("id", id)
        .eq("created_by", user.id)
    : await supabase.from("employees").insert(payload);

  let schemaWarning: string | null = null;

  if (error && isMissingEmployeeColumnError(error.message)) {
    const legacyPayload = {
      name: parsed.data.name,
      phone: parsed.data.phone,
      role: parsed.data.role,
      joining_date: parsed.data.joining_date,
      status: parsed.data.status,
      email: normalizedEmail,
    };

    const retryResult = id
      ? await supabase
          .from("employees")
          .update(legacyPayload)
          .eq("id", id)
          .eq("created_by", user.id)
      : await supabase.from("employees").insert(legacyPayload);

    error = retryResult.error;

    if (!error) {
      schemaWarning =
        "Employee saved with legacy columns. Apply latest Supabase migrations to enable department, salary, and employee login passwords.";
    }
  }

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  revalidatePath("/leaves");
  revalidatePath("/tasks");
  revalidatePath("/salary");

  return successResult(
    id
      ? parsed.data.password
        ? "Employee updated and password reset."
        : "Employee updated."
      : schemaWarning
        ? schemaWarning
      : normalizedEmail && passwordHash
          ? "Employee added. Employee login is ready."
        : normalizedEmail
          ? "Employee added. Set a password later to enable employee login."
          : "Employee added.",
  );
}

export async function deleteEmployeeAction(id: string) {
  const { profile, supabase, user } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const existingEmployeeResult = await supabase
    .from("employees")
    .select("id")
    .eq("id", id)
    .eq("created_by", user.id)
    .maybeSingle();

  if (existingEmployeeResult.error) {
    return errorResult(existingEmployeeResult.error.message);
  }

  if (!existingEmployeeResult.data) {
    return errorResult("Employee not found.");
  }

  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  revalidatePath("/leaves");
  revalidatePath("/tasks");
  revalidatePath("/salary");

  return successResult("Employee deleted.");
}
