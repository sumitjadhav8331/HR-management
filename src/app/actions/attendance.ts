"use server";

import { revalidatePath } from "next/cache";
import {
  calculateTotalHours,
  errorResult,
  getActionContext,
  requireEmployeeLinkAction,
  requireHrAction,
  getString,
  successResult,
  toIsoDateTime,
  validationError,
} from "@/lib/action-utils";
import { attendanceSchema } from "@/lib/validators";

export async function saveAttendanceAction(formData: FormData) {
  const id = getString(formData, "id");
  const { employee, profile, supabase } = await getActionContext();
  const employeeGuard = requireEmployeeLinkAction(employee);

  if (profile.role === "employee" && employeeGuard) {
    return employeeGuard;
  }

  const parsed = attendanceSchema.safeParse({
    employee_id:
      profile.role === "employee"
        ? employee!.id
        : getString(formData, "employee_id"),
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
  const { profile, supabase } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const { error } = await supabase.from("attendance").delete().eq("id", id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult("Attendance entry deleted.");
}

export async function employeeCheckInAction(formData: FormData) {
  const { employee, profile, supabase } = await getActionContext();
  const employeeGuard = requireEmployeeLinkAction(employee);

  if (profile.role !== "employee") {
    return errorResult("Only employee accounts can use check in.");
  }

  if (employeeGuard) {
    return employeeGuard;
  }
  if (!employee) {
    return errorResult("Employee profile link is required.");
  }
  const employeeRecord = employee;

  const attendanceDate = getString(formData, "attendance_date");
  const latitude = getString(formData, "latitude");
  const longitude = getString(formData, "longitude");
  const address = getString(formData, "address");

  if (!attendanceDate) {
    return errorResult("Attendance date is required.");
  }

  const existingResult = await supabase
    .from("attendance")
    .select("id")
    .eq("employee_id", employeeRecord.id)
    .eq("attendance_date", attendanceDate)
    .is("logout_time", null)
    .maybeSingle();

  if (existingResult.error) {
    return errorResult(existingResult.error.message);
  }

  if (existingResult.data) {
    return errorResult("You already checked in today. Please check out first.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("attendance").insert({
    address: address || null,
    attendance_date: attendanceDate,
    employee_id: employeeRecord.id,
    latitude: latitude ? Number(latitude) : null,
    login_time: now,
    longitude: longitude ? Number(longitude) : null,
    logout_time: null,
    total_hours: null,
  });

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");

  return successResult("Check in successful.");
}

export async function employeeCheckOutAction(formData: FormData) {
  const { employee, profile, supabase } = await getActionContext();
  const employeeGuard = requireEmployeeLinkAction(employee);

  if (profile.role !== "employee") {
    return errorResult("Only employee accounts can use check out.");
  }

  if (employeeGuard) {
    return employeeGuard;
  }
  if (!employee) {
    return errorResult("Employee profile link is required.");
  }
  const employeeRecord = employee;

  const attendanceDate = getString(formData, "attendance_date");

  if (!attendanceDate) {
    return errorResult("Attendance date is required.");
  }

  const openResult = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeRecord.id)
    .eq("attendance_date", attendanceDate)
    .is("logout_time", null)
    .order("login_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openResult.error) {
    return errorResult(openResult.error.message);
  }

  if (!openResult.data) {
    return errorResult("No active check in found for today.");
  }

  const logoutTime = new Date().toISOString();
  const totalHours = calculateTotalHours(openResult.data.login_time, logoutTime);

  const { error } = await supabase
    .from("attendance")
    .update({
      logout_time: logoutTime,
      total_hours: totalHours,
    })
    .eq("id", openResult.data.id);

  if (error) {
    return errorResult(error.message);
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");

  return successResult("Check out successful.");
}
