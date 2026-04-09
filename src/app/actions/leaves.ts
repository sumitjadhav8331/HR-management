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
import { hrOwnsEmployee } from "@/lib/hr-scope";
import { sql } from "@/lib/server/postgres";
import { leaveSchema } from "@/lib/validators";

function isMissingLeaveStatusColumnError(message: string) {
  return message.includes("Could not find the 'status' column");
}

export async function saveLeaveAction(formData: FormData) {
  const { employee, profile, supabase, user } = await getActionContext();
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

    if (!employee) {
      return errorResult("Employee account is not available right now.");
    }

    await sql(
      `
        insert into public.leaves (
          created_by,
          employee_id,
          date,
          reason,
          status
        )
        values ($1, $2, $3, $4, 'pending')
      `,
      [employee.created_by, employee.id, parsed.data.date, parsed.data.reason],
    );

    revalidatePath("/leaves");
    revalidatePath("/dashboard");

    return successResult("Leave request submitted.");
  } else {
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
  const { profile, supabase, user } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const existingLeaveResult = await supabase
    .from("leaves")
    .select("employee_id")
    .eq("id", id)
    .maybeSingle();

  if (existingLeaveResult.error) {
    return errorResult(existingLeaveResult.error.message);
  }

  if (!existingLeaveResult.data) {
    return errorResult("Leave entry not found.");
  }

  const ownershipResult = await hrOwnsEmployee(
    supabase,
    user.id,
    existingLeaveResult.data.employee_id,
  );

  if (ownershipResult.error) {
    return errorResult(ownershipResult.error.message);
  }

  if (!ownershipResult.data) {
    return errorResult("Leave entry not found.");
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
  const { profile, supabase, user } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const existingLeaveResult = await supabase
    .from("leaves")
    .select("employee_id")
    .eq("id", id)
    .maybeSingle();

  if (existingLeaveResult.error) {
    return errorResult(existingLeaveResult.error.message);
  }

  if (!existingLeaveResult.data) {
    return errorResult("Leave entry not found.");
  }

  const ownershipResult = await hrOwnsEmployee(
    supabase,
    user.id,
    existingLeaveResult.data.employee_id,
  );

  if (ownershipResult.error) {
    return errorResult(ownershipResult.error.message);
  }

  if (!ownershipResult.data) {
    return errorResult("Leave entry not found.");
  }

  const { error } = await supabase.from("leaves").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/leaves");
  revalidatePath("/dashboard");

  return successResult("Leave entry deleted.");
}
