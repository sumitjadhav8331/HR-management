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
import { createStatelessSupabaseClient } from "@/lib/supabase/stateless";
import { employeeSchema } from "@/lib/validators";

function isMissingEmployeeColumnError(message: string) {
  return (
    message.includes("Could not find the 'department' column") ||
    message.includes("Could not find the 'salary' column") ||
    message.includes("Could not find the 'user_id' column")
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

  const { profile, supabase } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const existingEmployeeResult = id
    ? await supabase.from("employees").select("*").eq("id", id).maybeSingle()
    : { data: null, error: null };

  if (existingEmployeeResult.error) {
    return errorResult(existingEmployeeResult.error.message);
  }

  let linkedUserId = existingEmployeeResult.data?.user_id ?? null;
  let loginWarning: string | null = null;

  if (!linkedUserId && parsed.data.email && parsed.data.password) {
    const authClient = createStatelessSupabaseClient();
    const authResult = await authClient.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.name,
          role: "employee",
        },
      },
    });

    if (authResult.error) {
      const authMessage = authResult.error.message.toLowerCase();

      if (authMessage.includes("rate limit")) {
        loginWarning =
          "Employee saved, but login account was not created because Supabase email rate limit was exceeded. Retry account linking in a few minutes.";
      } else if (authMessage.includes("already registered")) {
        const existingUserByEmail = await supabase
          .from("users")
          .select("id")
          .eq("email", parsed.data.email)
          .maybeSingle();

        if (existingUserByEmail.error) {
          return errorResult(existingUserByEmail.error.message);
        }

        linkedUserId = existingUserByEmail.data?.id ?? null;

        if (!linkedUserId) {
          loginWarning =
            "Employee saved, but this email is already registered and could not be auto-linked.";
        }
      } else {
        return errorResult(authResult.error.message);
      }
    } else {
      linkedUserId = authResult.data.user?.id ?? null;
    }
  }

  const payload = {
    name: parsed.data.name,
    phone: parsed.data.phone,
    role: parsed.data.role,
    department: parsed.data.department,
    salary: parsed.data.salary,
    joining_date: parsed.data.joining_date,
    status: parsed.data.status,
    email: getOptionalString(formData, "email"),
    user_id: linkedUserId,
  };

  let { error } = id
    ? await supabase.from("employees").update(payload).eq("id", id)
    : await supabase.from("employees").insert(payload);

  let schemaWarning: string | null = null;

  if (error && isMissingEmployeeColumnError(error.message)) {
    const legacyPayload = {
      name: parsed.data.name,
      phone: parsed.data.phone,
      role: parsed.data.role,
      joining_date: parsed.data.joining_date,
      status: parsed.data.status,
      email: getOptionalString(formData, "email"),
    };

    const retryResult = id
      ? await supabase.from("employees").update(legacyPayload).eq("id", id)
      : await supabase.from("employees").insert(legacyPayload);

    error = retryResult.error;

    if (!error) {
      schemaWarning =
        "Employee saved with legacy columns. Apply latest Supabase migrations to enable department, salary, and login linking.";
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
      ? "Employee updated."
      : schemaWarning
        ? schemaWarning
      : loginWarning
        ? loginWarning
        : linkedUserId
          ? "Employee added and login account created."
          : "Employee added.",
  );
}

export async function deleteEmployeeAction(id: string) {
  const { profile, supabase } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const { error } = await supabase.from("employees").delete().eq("id", id);

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
