"use server";

import { revalidatePath } from "next/cache";
import {
  errorResult,
  getActionContext,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { leaveSchema } from "@/lib/validators";

export async function saveLeaveAction(formData: FormData) {
  const parsed = leaveSchema.safeParse({
    employee_id: getString(formData, "employee_id"),
    date: getString(formData, "date"),
    reason: getString(formData, "reason"),
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { supabase } = await getActionContext();
  const { error } = await supabase.from("leaves").insert(parsed.data);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/leaves");
  revalidatePath("/dashboard");

  return successResult("Leave entry added.");
}

export async function deleteLeaveAction(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("leaves").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/leaves");
  revalidatePath("/dashboard");

  return successResult("Leave entry deleted.");
}
