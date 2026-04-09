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
import { taskSchema } from "@/lib/validators";

export async function saveTaskAction(formData: FormData) {
  const id = getString(formData, "id");
  const { profile, supabase } = await getActionContext();
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
  const { employee, profile, supabase } = await getActionContext();
  let taskQuery = supabase.from("tasks").update({
    status: nextStatus,
    completed_at: nextStatus === "completed" ? dateKey(new Date()) : null,
  });

  if (profile.role === "employee") {
    const employeeGuard = requireEmployeeLinkAction(employee);

    if (employeeGuard) {
      return employeeGuard;
    }
    if (!employee) {
      return errorResult("Employee profile link is required.");
    }

    taskQuery = taskQuery.eq("assigned_to", employee.id);
  }

  const { error } = await taskQuery.eq("id", id);

  if (error) {
    return errorResult(error.message);
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
  const { employee, profile, supabase } = await getActionContext();
  let updateQuery = supabase.from("tasks").update({
    completion_notes: completionNotes,
    ...(markCompleted
      ? { completed_at: dateKey(new Date()), status: "completed" as const }
      : {}),
  });

  if (profile.role === "employee") {
    const employeeGuard = requireEmployeeLinkAction(employee);

    if (employeeGuard) {
      return employeeGuard;
    }
    if (!employee) {
      return errorResult("Employee profile link is required.");
    }

    updateQuery = updateQuery.eq("assigned_to", employee.id);
  } else {
    const hrGuard = requireHrAction(profile);

    if (hrGuard) {
      return hrGuard;
    }
  }

  const { error } = await updateQuery.eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return successResult("Task note saved.");
}

export async function deleteTaskAction(id: string) {
  const { profile, supabase } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
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
