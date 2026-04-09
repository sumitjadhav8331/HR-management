"use server";

import { revalidatePath } from "next/cache";
import {
  errorResult,
  getActionContext,
  getOptionalString,
  requireHrAction,
  getString,
  successResult,
  validationError,
} from "@/lib/action-utils";
import { candidateSchema } from "@/lib/validators";

export async function saveCandidateAction(formData: FormData) {
  const id = getString(formData, "id");
  const { profile, supabase } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const parsed = candidateSchema.safeParse({
    name: getString(formData, "name"),
    phone: getString(formData, "phone"),
    position: getString(formData, "position"),
    call_status: getString(formData, "call_status"),
    response: getString(formData, "response") || undefined,
    expected_joining_date:
      getString(formData, "expected_joining_date") || undefined,
    final_status: getString(formData, "final_status"),
    call_date: getString(formData, "call_date"),
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const payload = {
    ...parsed.data,
    response: getOptionalString(formData, "response"),
    expected_joining_date: getOptionalString(formData, "expected_joining_date"),
  };

  const { error } = id
    ? await supabase.from("candidates").update(payload).eq("id", id)
    : await supabase.from("candidates").insert(payload);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/recruitment");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult(id ? "Candidate updated." : "Candidate saved.");
}

export async function deleteCandidateAction(id: string) {
  const { profile, supabase } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const { error } = await supabase.from("candidates").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/recruitment");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult("Candidate deleted.");
}
