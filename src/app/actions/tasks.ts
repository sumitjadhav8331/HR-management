"use server";

import { revalidatePath } from "next/cache";
import { dateKey } from "@/lib/utils";
import {
  errorResult,
  getActionContext,
  getOptionalString,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { taskSchema } from "@/lib/validators";

export async function saveTaskAction(formData: FormData) {
  const id = getString(formData, "id");
  const parsed = taskSchema.safeParse({
    title: getString(formData, "title"),
    description: getString(formData, "description") || undefined,
    status: getString(formData, "status") || "pending",
    priority: getString(formData, "priority"),
    deadline: getString(formData, "deadline") || undefined,
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { supabase } = await getActionContext();
  const payload = {
    ...parsed.data,
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
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: nextStatus,
      completed_at: nextStatus === "completed" ? dateKey(new Date()) : null,
    })
    .eq("id", id);

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

export async function deleteTaskAction(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult("Task deleted.");
}
