"use server";

import { revalidatePath } from "next/cache";
import { dateKey } from "@/lib/utils";
import {
  errorResult,
  getActionContext,
  getOptionalString,
  requireEmployeeLinkAction,
  requireHrAction,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { hrOwnsEmployee } from "@/lib/hr-scope";
import { sql } from "@/lib/server/postgres";
import { taskSchema } from "@/lib/validators";

export async function saveTaskAction(formData: FormData) {
  const id = getString(formData, "id");
  const { profile, supabase, user } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const parsed = taskSchema.safeParse({
    title: getString(formData, "title"),
    description: getString(formData, "description") || undefined,
    assigned_to: getString(formData, "assigned_to"),
    status: getString(formData, "status") || "pending",
    priority: getString(formData, "priority"),
    deadline: getString(formData, "deadline") || undefined,
    completion_notes: getString(formData, "completion_notes") || undefined,
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const ownedEmployeeResult = await hrOwnsEmployee(
    supabase,
    user.id,
    parsed.data.assigned_to,
  );

  if (ownedEmployeeResult.error) {
    return errorResult(ownedEmployeeResult.error.message);
  }

  if (!ownedEmployeeResult.data) {
    return errorResult("Assign the task to one of your employees.");
  }

  if (id) {
    const existingTaskResult = await supabase
      .from("tasks")
      .select("assigned_to")
      .eq("id", id)
      .maybeSingle();

    if (existingTaskResult.error) {
      return errorResult(existingTaskResult.error.message);
    }

    if (!existingTaskResult.data?.assigned_to) {
      return errorResult("Task not found.");
    }

    const existingOwnershipResult = await hrOwnsEmployee(
      supabase,
      user.id,
      existingTaskResult.data.assigned_to,
    );

    if (existingOwnershipResult.error) {
      return errorResult(existingOwnershipResult.error.message);
    }

    if (!existingOwnershipResult.data) {
      return errorResult("Task not found.");
    }
  }

  const payload = {
    ...parsed.data,
    assigned_to: parsed.data.assigned_to,
    completion_notes: getOptionalString(formData, "completion_notes"),
    description: getOptionalString(formData, "description"),
    deadline: getOptionalString(formData, "deadline"),
    completed_at:
      parsed.data.status === "completed" ? dateKey(new Date()) : null,
  };

  const { error } = id
    ? await supabase.from("tasks").update(payload).eq("id", id)
    : await supabase.from("tasks").insert(payload);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult(id ? "Task updated." : "Task created.");
}

export async function toggleTaskStatusAction(
  id: string,
  nextStatus: "pending" | "completed",
) {
  const { employee, profile, supabase, user } = await getActionContext();

  if (profile.role === "employee") {
    const employeeGuard = requireEmployeeLinkAction(employee);

    if (employeeGuard) {
      return employeeGuard;
    }
    if (!employee) {
      return errorResult("Employee profile link is required.");
    }

    const updateResult = await sql<{ id: string }>(
      `
        update public.tasks
        set status = $1,
            completed_at = $2
        where id = $3
          and assigned_to = $4
        returning id
      `,
      [nextStatus, nextStatus === "completed" ? dateKey(new Date()) : null, id, employee.id],
    );

    if (!updateResult.rows[0]) {
      return errorResult("Task not found.");
    }
  } else {
    const taskQuery = supabase.from("tasks").update({
      status: nextStatus,
      completed_at: nextStatus === "completed" ? dateKey(new Date()) : null,
    });
    const hrGuard = requireHrAction(profile);

    if (hrGuard) {
      return hrGuard;
    }

    const existingTaskResult = await supabase
      .from("tasks")
      .select("assigned_to")
      .eq("id", id)
      .maybeSingle();

    if (existingTaskResult.error) {
      return errorResult(existingTaskResult.error.message);
    }

    if (!existingTaskResult.data?.assigned_to) {
      return errorResult("Task not found.");
    }

    const ownershipResult = await hrOwnsEmployee(
      supabase,
      user.id,
      existingTaskResult.data.assigned_to,
    );

    if (ownershipResult.error) {
      return errorResult(ownershipResult.error.message);
    }

    if (!ownershipResult.data) {
      return errorResult("Task not found.");
    }

    const { error } = await taskQuery.eq("id", id);

    if (error) {
      return errorResult(error.message);
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult(
    nextStatus === "completed" ? "Task marked complete." : "Task reopened.",
  );
}

export async function saveTaskCompletionNoteAction(formData: FormData) {
  const id = getString(formData, "id");
  const completionNotes = getOptionalString(formData, "completion_notes");
  const markCompleted = getString(formData, "mark_completed") === "true";
  const { employee, profile, supabase, user } = await getActionContext();

  if (profile.role === "employee") {
    const employeeGuard = requireEmployeeLinkAction(employee);

    if (employeeGuard) {
      return employeeGuard;
    }
    if (!employee) {
      return errorResult("Employee profile link is required.");
    }

    const updateResult = await sql<{ id: string }>(
      `
        update public.tasks
        set completion_notes = $1,
            completed_at = case when $2 then $3 else completed_at end,
            status = case when $2 then 'completed' else status end
        where id = $4
          and assigned_to = $5
        returning id
      `,
      [completionNotes, markCompleted, dateKey(new Date()), id, employee.id],
    );

    if (!updateResult.rows[0]) {
      return errorResult("Task not found.");
    }
  } else {
    const updateQuery = supabase.from("tasks").update({
      completion_notes: completionNotes,
      ...(markCompleted
        ? { completed_at: dateKey(new Date()), status: "completed" as const }
        : {}),
    });
    const hrGuard = requireHrAction(profile);

    if (hrGuard) {
      return hrGuard;
    }

    const existingTaskResult = await supabase
      .from("tasks")
      .select("assigned_to")
      .eq("id", id)
      .maybeSingle();

    if (existingTaskResult.error) {
      return errorResult(existingTaskResult.error.message);
    }

    if (!existingTaskResult.data?.assigned_to) {
      return errorResult("Task not found.");
    }

    const ownershipResult = await hrOwnsEmployee(
      supabase,
      user.id,
      existingTaskResult.data.assigned_to,
    );

    if (ownershipResult.error) {
      return errorResult(ownershipResult.error.message);
    }

    if (!ownershipResult.data) {
      return errorResult("Task not found.");
    }

    const { error } = await updateQuery.eq("id", id);

    if (error) {
      return errorResult(error.message);
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return successResult("Task note saved.");
}

export async function deleteTaskAction(id: string) {
  const { profile, supabase, user } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const existingTaskResult = await supabase
    .from("tasks")
    .select("assigned_to")
    .eq("id", id)
    .maybeSingle();

  if (existingTaskResult.error) {
    return errorResult(existingTaskResult.error.message);
  }

  if (!existingTaskResult.data?.assigned_to) {
    return errorResult("Task not found.");
  }

  const ownershipResult = await hrOwnsEmployee(
    supabase,
    user.id,
    existingTaskResult.data.assigned_to,
  );

  if (ownershipResult.error) {
    return errorResult(ownershipResult.error.message);
  }

  if (!ownershipResult.data) {
    return errorResult("Task not found.");
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult("Task deleted.");
}
