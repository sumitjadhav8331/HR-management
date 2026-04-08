"use server";

import { revalidatePath } from "next/cache";
import {
  errorResult,
  getActionContext,
  getOptionalString,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { employeeSchema } from "@/lib/validators";

export async function saveEmployeeAction(formData: FormData) {
  const id = getString(formData, "id");
  const parsed = employeeSchema.safeParse({
    name: getString(formData, "name"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    role: getString(formData, "role"),
    joining_date: getString(formData, "joining_date"),
    status: getString(formData, "status"),
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { supabase } = await getActionContext();
  const payload = {
    ...parsed.data,
    email: getOptionalString(formData, "email"),
  };

  const { error } = id
    ? await supabase.from("employees").update(payload).eq("id", id)
    : await supabase.from("employees").insert(payload);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  revalidatePath("/leaves");

  return successResult(id ? "Employee updated." : "Employee added.");
}

export async function deleteEmployeeAction(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("employees").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  revalidatePath("/leaves");

  return successResult("Employee deleted.");
}
