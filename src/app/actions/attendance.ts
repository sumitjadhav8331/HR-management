"use server";

import { revalidatePath } from "next/cache";
import {
  calculateTotalHours,
  errorResult,
  getActionContext,
  getString,
  successResult,
  toIsoDateTime,
  validationError,
} from "@/lib/action-utils";
import { attendanceSchema } from "@/lib/validators";

export async function saveAttendanceAction(formData: FormData) {
  const id = getString(formData, "id");
  const parsed = attendanceSchema.safeParse({
    employee_id: getString(formData, "employee_id"),
    attendance_date: getString(formData, "attendance_date"),
    login_time: getString(formData, "login_time"),
    logout_time: getString(formData, "logout_time") || undefined,
    latitude: getString(formData, "latitude") || undefined,
    longitude: getString(formData, "longitude") || undefined,
    address: getString(formData, "address") || undefined,
  });

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const loginTime = toIsoDateTime(parsed.data.login_time);
  const logoutTime = parsed.data.logout_time
    ? toIsoDateTime(parsed.data.logout_time)
    : null;
  const totalHours = calculateTotalHours(loginTime, logoutTime);
  const { supabase } = await getActionContext();

  const payload = {
    employee_id: parsed.data.employee_id,
    attendance_date: parsed.data.attendance_date,
    login_time: loginTime,
    logout_time: logoutTime,
    total_hours: totalHours,
    latitude: parsed.data.latitude ?? null,
    longitude: parsed.data.longitude ?? null,
    address: parsed.data.address?.trim() || null,
  };

  const { error } = id
    ? await supabase.from("attendance").update(payload).eq("id", id)
    : await supabase.from("attendance").insert(payload);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult(id ? "Attendance updated." : "Attendance saved.");
}

export async function deleteAttendanceAction(id: string) {
  const { supabase } = await getActionContext();
  const { error } = await supabase.from("attendance").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult("Attendance entry deleted.");
}
