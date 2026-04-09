"use server";

import { revalidatePath } from "next/cache";
import {
  errorResult,
  getActionContext,
  requireHrAction,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { hrOwnsEmployee } from "@/lib/hr-scope";
import { salarySchema } from "@/lib/validators";

export async function saveSalaryAction(formData: FormData) {
  const id = getString(formData, "id");
  const { profile, supabase, user } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

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

  const ownedEmployeeResult = await hrOwnsEmployee(
    supabase,
    user.id,
    parsed.data.employee_id,
  );

  if (ownedEmployeeResult.error) {
    return errorResult(ownedEmployeeResult.error.message);
  }

  if (!ownedEmployeeResult.data) {
    return errorResult("Select one of your employees.");
  }

  if (id) {
    const existingSalaryResult = await supabase
      .from("salaries")
      .select("employee_id")
      .eq("id", id)
      .maybeSingle();

    if (existingSalaryResult.error) {
      return errorResult(existingSalaryResult.error.message);
    }

    if (!existingSalaryResult.data) {
      return errorResult("Salary record not found.");
    }

    const existingOwnershipResult = await hrOwnsEmployee(
      supabase,
      user.id,
      existingSalaryResult.data.employee_id,
    );

    if (existingOwnershipResult.error) {
      return errorResult(existingOwnershipResult.error.message);
    }

    if (!existingOwnershipResult.data) {
      return errorResult("Salary record not found.");
    }
  }

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
  const { profile, supabase, user } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const existingSalaryResult = await supabase
    .from("salaries")
    .select("employee_id")
    .eq("id", id)
    .maybeSingle();

  if (existingSalaryResult.error) {
    return errorResult(existingSalaryResult.error.message);
  }

  if (!existingSalaryResult.data) {
    return errorResult("Salary record not found.");
  }

  const ownershipResult = await hrOwnsEmployee(
    supabase,
    user.id,
    existingSalaryResult.data.employee_id,
  );

  if (ownershipResult.error) {
    return errorResult(ownershipResult.error.message);
  }

  if (!ownershipResult.data) {
    return errorResult("Salary record not found.");
  }

  const { error } = await supabase.from("salaries").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/salary");
  revalidatePath("/dashboard");
  return successResult("Salary record deleted.");
}
