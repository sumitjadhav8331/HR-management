import { isBefore, startOfToday } from "date-fns";
import { requireEmployeeProfile } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import type { Tables } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildPagination, dateKey } from "@/lib/utils";

type SearchParamsInput = {
  page?: number;
  status?: string;
};

export async function getEmployeeDashboardData() {
  const { employee, profile, user } = await requireEmployeeProfile();

  if (!employee) {
    return {
      employee: null,
      latestSalary: null,
      metrics: {
        completedTasks: 0,
        pendingLeaves: 0,
        pendingTasks: 0,
      },
      recentLeaves: [] as Tables<"leaves">[],
      tasks: [] as Tables<"tasks">[],
      todayAttendance: null as Tables<"attendance"> | null,
      user,
      profile,
    };
  }

  const supabase = await createServerSupabaseClient();
  const today = dateKey(new Date());

  const [
    todayAttendanceResult,
    pendingTasksResult,
    completedTasksResult,
    pendingLeavesResult,
    tasksResult,
    recentLeavesResult,
    latestSalaryResult,
  ] = await Promise.all([
    supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("attendance_date", today)
      .order("login_time", { ascending: false })
      .limit(1),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", employee.id)
      .eq("status", "pending"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", employee.id)
      .eq("status", "completed"),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .eq("status", "pending"),
    supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", employee.id)
      .order("status", { ascending: true })
      .order("deadline", { ascending: true })
      .limit(5),
    supabase
      .from("leaves")
      .select("*")
      .eq("employee_id", employee.id)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("salaries")
      .select("*")
      .eq("employee_id", employee.id)
      .order("month", { ascending: false })
      .limit(1),
  ]);

  return {
    employee,
    latestSalary: latestSalaryResult.data?.[0] ?? null,
    metrics: {
      completedTasks: completedTasksResult.count ?? 0,
      pendingLeaves: pendingLeavesResult.count ?? 0,
      pendingTasks: pendingTasksResult.count ?? 0,
    },
    profile,
    recentLeaves: (recentLeavesResult.data ?? []) as Tables<"leaves">[],
    tasks: (tasksResult.data ?? []) as Tables<"tasks">[],
    todayAttendance: (todayAttendanceResult.data ?? [])[0] ?? null,
    user,
  };
}

export async function getEmployeeAttendancePageData({ page }: SearchParamsInput) {
  const { employee } = await requireEmployeeProfile();

  if (!employee) {
    return {
      employee: null,
      pagination: buildPagination(0, page ?? 1, PAGE_SIZE),
      records: [] as Tables<"attendance">[],
      todayDate: dateKey(new Date()),
      todayRecord: null as Tables<"attendance"> | null,
    };
  }

  const supabase = await createServerSupabaseClient();
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  const todayDate = dateKey(new Date());

  const [todayResult, recordsResult] = await Promise.all([
    supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", employee.id)
      .eq("attendance_date", todayDate)
      .order("login_time", { ascending: false })
      .limit(1),
    supabase
      .from("attendance")
      .select("*", { count: "exact" })
      .eq("employee_id", employee.id)
      .order("attendance_date", { ascending: false })
      .order("login_time", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
  ]);

  return {
    employee,
    pagination: buildPagination(recordsResult.count ?? 0, page ?? 1, PAGE_SIZE),
    records: (recordsResult.data ?? []) as Tables<"attendance">[],
    todayDate,
    todayRecord: (todayResult.data ?? [])[0] ?? null,
  };
}

export async function getEmployeeTasksPageData({ page, status }: SearchParamsInput) {
  const { employee } = await requireEmployeeProfile();

  if (!employee) {
    return {
      employee: null,
      metrics: {
        completed: 0,
        overdue: 0,
        pending: 0,
      },
      pagination: buildPagination(0, page ?? 1, PAGE_SIZE),
      tasks: [] as Tables<"tasks">[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  let builder = supabase
    .from("tasks")
    .select("*", { count: "exact" })
    .eq("assigned_to", employee.id)
    .order("status", { ascending: true })
    .order("deadline", { ascending: true });

  if (status) {
    builder = builder.eq("status", status as Tables<"tasks">["status"]);
  }

  const [listResult, completedResult, pendingResult, allTasksResult] = await Promise.all([
    builder.range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", employee.id)
      .eq("status", "completed"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", employee.id)
      .eq("status", "pending"),
    supabase
      .from("tasks")
      .select("deadline, status")
      .eq("assigned_to", employee.id),
  ]);

  const today = startOfToday();
  const overdue = (allTasksResult.data ?? []).filter(
    (task) =>
      task.status !== "completed" &&
      task.deadline &&
      isBefore(new Date(task.deadline), today),
  ).length;

  return {
    employee,
    metrics: {
      completed: completedResult.count ?? 0,
      overdue,
      pending: pendingResult.count ?? 0,
    },
    pagination: buildPagination(listResult.count ?? 0, page ?? 1, PAGE_SIZE),
    tasks: (listResult.data ?? []) as Tables<"tasks">[],
  };
}

export async function getEmployeeLeavesPageData({ page }: SearchParamsInput) {
  const { employee } = await requireEmployeeProfile();

  if (!employee) {
    return {
      employee: null,
      metrics: {
        approved: 0,
        pending: 0,
        rejected: 0,
      },
      pagination: buildPagination(0, page ?? 1, PAGE_SIZE),
      leaves: [] as Tables<"leaves">[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;

  const [listResult, pendingResult, approvedResult, rejectedResult] = await Promise.all([
    supabase
      .from("leaves")
      .select("*", { count: "exact" })
      .eq("employee_id", employee.id)
      .order("date", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .eq("status", "pending"),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .eq("status", "approved"),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee.id)
      .eq("status", "rejected"),
  ]);

  return {
    employee,
    leaves: (listResult.data ?? []) as Tables<"leaves">[],
    metrics: {
      approved: approvedResult.count ?? 0,
      pending: pendingResult.count ?? 0,
      rejected: rejectedResult.count ?? 0,
    },
    pagination: buildPagination(listResult.count ?? 0, page ?? 1, PAGE_SIZE),
  };
}

export async function getEmployeeSalaryPageData({ page }: SearchParamsInput) {
  const { employee } = await requireEmployeeProfile();

  if (!employee) {
    return {
      employee: null,
      pagination: buildPagination(0, page ?? 1, PAGE_SIZE),
      salaries: [] as Tables<"salaries">[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  const listResult = await supabase
    .from("salaries")
    .select("*", { count: "exact" })
    .eq("employee_id", employee.id)
    .order("month", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  return {
    employee,
    pagination: buildPagination(listResult.count ?? 0, page ?? 1, PAGE_SIZE),
    salaries: (listResult.data ?? []) as Tables<"salaries">[],
  };
}
