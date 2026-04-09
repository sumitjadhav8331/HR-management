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
import { hrOwnsEmployee } from "@/lib/hr-scope";
import { sql } from "@/lib/server/postgres";
import type { Tables } from "@/lib/supabase/database.types";
import { attendanceSchema } from "@/lib/validators";

export async function saveAttendanceAction(formData: FormData) {
  const id = getString(formData, "id");
  const { employee, profile, supabase, user } = await getActionContext();
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

  if (profile.role === "hr") {
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
      const existingRecordResult = await supabase
        .from("attendance")
        .select("employee_id")
        .eq("id", id)
        .maybeSingle();

      if (existingRecordResult.error) {
        return errorResult(existingRecordResult.error.message);
      }

      if (!existingRecordResult.data) {
        return errorResult("Attendance entry not found.");
      }

      const existingOwnershipResult = await hrOwnsEmployee(
        supabase,
        user.id,
        existingRecordResult.data.employee_id,
      );

      if (existingOwnershipResult.error) {
        return errorResult(existingOwnershipResult.error.message);
      }

      if (!existingOwnershipResult.data) {
        return errorResult("Attendance entry not found.");
      }
    }
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

  if (profile.role === "employee") {
    if (!employee) {
      return errorResult("Employee account is not available right now.");
    }

    if (id) {
      const updateResult = await sql<{ id: string }>(
        `
          update public.attendance
          set attendance_date = $1,
              login_time = $2,
              logout_time = $3,
              total_hours = $4,
              latitude = $5,
              longitude = $6,
              address = $7
          where id = $8
            and employee_id = $9
          returning id
        `,
        [
          payload.attendance_date,
          payload.login_time,
          payload.logout_time,
          payload.total_hours,
          payload.latitude,
          payload.longitude,
          payload.address,
          id,
          employee.id,
        ],
      );

      if (!updateResult.rows[0]) {
        return errorResult("Attendance entry not found.");
      }
    } else {
      await sql(
        `
          insert into public.attendance (
            created_by,
            employee_id,
            attendance_date,
            login_time,
            logout_time,
            total_hours,
            latitude,
            longitude,
            address
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          employee.created_by,
          employee.id,
          payload.attendance_date,
          payload.login_time,
          payload.logout_time,
          payload.total_hours,
          payload.latitude,
          payload.longitude,
          payload.address,
        ],
      );
    }
  } else {
    const { error } = id
      ? await supabase.from("attendance").update(payload).eq("id", id)
      : await supabase.from("attendance").insert(payload);

    if (error) {
      return errorResult(error.message);
    }
  }

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return successResult(id ? "Attendance updated." : "Attendance saved.");
}

export async function deleteAttendanceAction(id: string) {
  const { profile, supabase, user } = await getActionContext();
  const hrGuard = requireHrAction(profile);

  if (hrGuard) {
    return hrGuard;
  }

  const existingRecordResult = await supabase
    .from("attendance")
    .select("employee_id")
    .eq("id", id)
    .maybeSingle();

  if (existingRecordResult.error) {
    return errorResult(existingRecordResult.error.message);
  }

  if (!existingRecordResult.data) {
    return errorResult("Attendance entry not found.");
  }

  const ownershipResult = await hrOwnsEmployee(
    supabase,
    user.id,
    existingRecordResult.data.employee_id,
  );

  if (ownershipResult.error) {
    return errorResult(ownershipResult.error.message);
  }

  if (!ownershipResult.data) {
    return errorResult("Attendance entry not found.");
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
  const { employee, profile } = await getActionContext();
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

  const existingResult = await sql<{ id: string }>(
    `
      select id
      from public.attendance
      where employee_id = $1
        and attendance_date = $2
        and logout_time is null
      limit 1
    `,
    [employeeRecord.id, attendanceDate],
  );

  if (existingResult.rows[0]) {
    return errorResult("You already checked in today. Please check out first.");
  }

  const now = new Date().toISOString();
  await sql(
    `
      insert into public.attendance (
        created_by,
        employee_id,
        attendance_date,
        login_time,
        latitude,
        longitude,
        address,
        logout_time,
        total_hours
      )
      values ($1, $2, $3, $4, $5, $6, $7, null, null)
    `,
    [
      employeeRecord.created_by,
      employeeRecord.id,
      attendanceDate,
      now,
      latitude ? Number(latitude) : null,
      longitude ? Number(longitude) : null,
      address || null,
    ],
  );

  revalidatePath("/attendance");
  revalidatePath("/dashboard");

  return successResult("Check in successful.");
}

export async function employeeCheckOutAction(formData: FormData) {
  const { employee, profile } = await getActionContext();
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

  const openResult = await sql<Tables<"attendance">>(
    `
      select *
      from public.attendance
      where employee_id = $1
        and attendance_date = $2
        and logout_time is null
      order by login_time desc
      limit 1
    `,
    [employeeRecord.id, attendanceDate],
  );

  if (!openResult.rows[0]) {
    return errorResult("No active check in found for today.");
  }

  const logoutTime = new Date().toISOString();
  const totalHours = calculateTotalHours(openResult.rows[0].login_time, logoutTime);

  await sql(
    `
      update public.attendance
      set logout_time = $1,
          total_hours = $2
      where id = $3
        and employee_id = $4
    `,
    [logoutTime, totalHours, openResult.rows[0].id, employeeRecord.id],
  );

  revalidatePath("/attendance");
  revalidatePath("/dashboard");

  return successResult("Check out successful.");
}
