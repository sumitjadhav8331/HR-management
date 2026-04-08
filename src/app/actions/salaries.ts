"use server";

import { revalidatePath } from "next/cache";
import {
  errorResult,
  getActionContext,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { salarySchema } from "@/lib/validators";

export async function saveSalaryAction(formData: FormData) {
  const id = getString(formData, "id");
  const parsed = salarySchema.safeParse({
    employee_id: getString(formData, "employee_id"),
    amount: getString(formData, "amount"),
    bonus: getString(formData, "bonus") || 0,
    deduction: getString(formData, "deduction") || 0,
    month: getString(formData, "month"),
    payment_status: getString(formData, "payment_status") || "pending",
    notes: getString(formData, "notes") || undefined,
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { supabase } = await getActionContext();
  const payload = {
    employee_id: parsed.data.employee_id,
    amount: parsed.data.amount,
    bonus: parsed.data.bonus,
    deduction: parsed.data.deduction,
    month: parsed.data.month,
    payment_status: parsed.data.payment_status,
    notes: parsed.data.notes?.trim() || null,
  };

  const { error } = id
    ? await supabase.from("salaries").update(payload).eq("id", id)
    : await supabase.from("salaries").insert(payload);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/salary");
  revalidatePath("/dashboard");
  return successResult(id ? "Salary updated." : "Salary saved.");
}

export async function deleteSalaryAction(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("salaries").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/salary");
  revalidatePath("/dashboard");
  return successResult("Salary record deleted.");
}
