"use server";

import { revalidatePath } from "next/cache";
import {
  errorResult,
  getActionContext,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { noteSchema } from "@/lib/validators";

export async function saveNoteAction(formData: FormData) {
  const parsed = noteSchema.safeParse({
    title: getString(formData, "title"),
    content: getString(formData, "content"),
    kind: getString(formData, "kind"),
    note_date: getString(formData, "note_date"),
    status: getString(formData, "status") || "open",
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { supabase } = await getActionContext();
  const { error } = await supabase.from("notes").insert(parsed.data);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult("Note saved.");
}

export async function toggleNoteStatusAction(
  id: string,
  nextStatus: "open" | "done",
) {
  const { supabase } = await getActionContext();
  const { error } = await supabase
    .from("notes")
    .update({ status: nextStatus })
    .eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult(
    nextStatus === "done" ? "Note marked done." : "Note reopened.",
  );
}

export async function deleteNoteAction(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult("Note deleted.");
}
