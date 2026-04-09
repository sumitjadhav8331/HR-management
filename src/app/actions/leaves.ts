"use server";

import { revalidatePath } from "next/cache";
import {
  errorResult,
  getActionContext,
  requireEmployeeLinkAction,
  requireHrAction,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { leaveSchema } from "@/lib/validators";

function isMissingLeaveStatusColumnError(message: string) {
  return message.includes("Could not find the 'status' column");
}

export async function saveLeaveAction(formData: FormData) {
  const { employee, profile, supabase } = await getActionContext();
  const parsed = leaveSchema.safeParse({
    employee_id:
      profile.role === "employee"
        ? employee?.id ?? ""
        : getString(formData, "employee_id"),
    date: getString(formData, "date"),
    reason: getString(formData, "reason"),
    status:
      profile.role === "hr"
        ? getString(formData, "status") || "pending"
        : "pending",
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (profile.role === "employee") {
    const employeeGuard = requireEmployeeLinkAction(employee);

    if (employeeGuard) {
      return employeeGuard;
    }
  }

  let { error } = await supabase.from("leaves").insert(parsed.data);

  let legacyWarning: string | null = null;

  if (error && isMissingLeaveStatusColumnError(error.message)) {
    const legacyPayload = {
      employee_id: parsed.data.employee_id,
      date: parsed.data.date,
      reason: parsed.data.reason,
    };

    const retryResult = await supabase.from("leaves").insert(legacyPayload);
    error = retryResult.error;

    if (!error) {
      legacyWarning =
        "Leave request submitted with legacy schema. Apply latest migrations to enable leave approval status tracking.";
    }
  }

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/leaves");
  revalidatePath("/dashboard");

  return successResult(legacyWarning ?? "Leave request submitted.");
}

export async function reviewLeaveAction(
  id: string,
  status: "approved" | "rejected",
) {
  const { profile, supabase } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const { error } = await supabase
    .from("leaves")
    .update({ status })
    .eq("id", id);

  if (error) {
    if (isMissingLeaveStatusColumnError(error.message)) {
      return errorResult(
        "Leave status review needs the latest database migration. Please apply migrations, then approve/reject.",
      );
    }
    return errorResult(error.message);
  }

  revalidatePath("/leaves");
  revalidatePath("/dashboard");

  return successResult(
    status === "approved" ? "Leave approved." : "Leave rejected.",
  );
}

export async function deleteLeaveAction(id: string) {
  const { profile, supabase } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const { error } = await supabase.from("leaves").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/leaves");
  revalidatePath("/dashboard");

  return successResult("Leave entry deleted.");
}
