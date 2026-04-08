import {
  eachDayOfInterval,
  format,
  isBefore,
  startOfToday,
  subDays,
} from "date-fns";
import { getUserLabel, requireProfile } from "@/lib/auth";
import { PAGE_SIZE, REPORT_STORAGE_BUCKET } from "@/lib/constants";
import type { Tables } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DailyReportSummary } from "@/lib/types";
import { buildPagination, dateKey } from "@/lib/utils";

type AttendanceWithEmployee = Tables<"attendance"> & {
  employee: Pick<Tables<"employees">, "id" | "name" | "role"> | null;
};

type LeaveWithEmployee = Tables<"leaves"> & {
  employee: Pick<Tables<"employees">, "id" | "name" | "role"> | null;
};

type ReportWithDownload = Tables<"reports"> & {
  downloadUrl: string | null;
  summary: DailyReportSummary;
};

type SearchParamsInput = {
  page?: number;
  query?: string;
  status?: string;
  date?: string;
  editId?: string;
};

function toDateRangeDays(selectedDate: string, days: number) {
  const end = new Date(`${selectedDate}T00:00:00`);
  const start = subDays(end, days - 1);

  return eachDayOfInterval({ start, end }).map((date) => ({
    key: format(date, "yyyy-MM-dd"),
    label: format(date, "dd MMM"),
  }));
}

export async function getDashboardData(date?: string) {
  const { user, profile } = await requireProfile();
  const supabase = await createServerSupabaseClient();
  const selectedDate = date || dateKey(new Date());
  const trendDays = toDateRangeDays(selectedDate, 7);
  const fromDate = trendDays[0]?.key ?? selectedDate;

  const [
    employeeCountResult,
    presentTodayResult,
    callsTodayResult,
    tasksCompletedTodayResult,
    callTrendResult,
    attendanceTrendResult,
    notesResult,
    recentTasksResult,
    pendingTasksResult,
    followUpCountResult,
    leaveCountResult,
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("attendance_date", selectedDate),
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("call_date", selectedDate),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("completed_at", selectedDate)
      .eq("status", "completed"),
    supabase
      .from("candidates")
      .select("call_date")
      .gte("call_date", fromDate)
      .lte("call_date", selectedDate),
    supabase
      .from("attendance")
      .select("attendance_date")
      .gte("attendance_date", fromDate)
      .lte("attendance_date", selectedDate),
    supabase
      .from("notes")
      .select("*")
      .eq("note_date", selectedDate)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .order("deadline", { ascending: true })
      .limit(5),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("call_date", selectedDate)
      .eq("call_status", "follow_up"),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("date", selectedDate),
  ]);

  const callsMap = new Map<string, number>();
  (callTrendResult.data ?? []).forEach((item) => {
    const value = callsMap.get(item.call_date) ?? 0;
    callsMap.set(item.call_date, value + 1);
  });

  const attendanceMap = new Map<string, number>();
  (attendanceTrendResult.data ?? []).forEach((item) => {
    const value = attendanceMap.get(item.attendance_date) ?? 0;
    attendanceMap.set(item.attendance_date, value + 1);
  });


  return {
    selectedDate,
    hrName: getUserLabel(profile, user.email),
    metrics: {
      totalEmployees: employeeCountResult.count ?? 0,
      presentToday: presentTodayResult.count ?? 0,
      absentToday: Math.max((employeeCountResult.count ?? 0) - (presentTodayResult.count ?? 0), 0),
      callsMadeToday: callsTodayResult.count ?? 0,
      tasksCompleted: tasksCompletedTodayResult.count ?? 0,
    },
    callsTrend: trendDays.map((day) => ({
      label: day.label,
      value: callsMap.get(day.key) ?? 0,
    })),
    attendanceTrend: trendDays.map((day) => ({
      label: day.label,
      value: attendanceMap.get(day.key) ?? 0,
    })),
    notes: (notesResult.data ?? []) as Tables<"notes">[],
    recentTasks: (recentTasksResult.data ?? []) as Tables<"tasks">[],
    summaryItems: [
      {
        label: "Pending tasks",
        value: pendingTasksResult.count ?? 0,
      },
      {
        label: "Follow-ups queued",
        value: followUpCountResult.count ?? 0,
      },
      {
        label: "Employees on leave",
        value: leaveCountResult.count ?? 0,
      },
      {
        label: "Notes captured",
        value: (notesResult.data ?? []).length,
      },
    ],
  };
}

export async function getEmployeeOptions() {
  await requireProfile();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("employees")
    .select("id, name, role, status")
    .order("name", { ascending: true });

  return data ?? [];
}

export async function getEmployeesPageData({
  page,
  query,
  status,
  editId,
}: SearchParamsInput) {
  await requireProfile();
  const supabase = await createServerSupabaseClient();
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  let builder = supabase
    .from("employees")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (query) {
    builder = builder.or(
      `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,role.ilike.%${query}%`,
    );
  }

  if (status) {
    builder = builder.eq("status", status as Tables<"employees">["status"]);
  }

  const [{ data, count }, editResult] = await Promise.all([
    builder.range(offset, offset + PAGE_SIZE - 1),
    editId
      ? supabase.from("employees").select("*").eq("id", editId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    employees: (data ?? []) as Tables<"employees">[],
    editingEmployee: (editResult.data ?? null) as Tables<"employees"> | null,
    pagination: buildPagination(count ?? 0, page ?? 1, PAGE_SIZE),
  };
}

export async function getAttendancePageData({
  page,
  date,
  editId,
}: SearchParamsInput) {
  await requireProfile();
  const supabase = await createServerSupabaseClient();
  const selectedDate = date || dateKey(new Date());
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  let builder = supabase
    .from("attendance")
    .select("*, employee:employees(id, name, role)", { count: "exact" })
    .order("attendance_date", { ascending: false })
    .order("login_time", { ascending: false });

  if (date) {
    builder = builder.eq("attendance_date", selectedDate);
  }

  const [recordsResult, editResult, employeeOptions, dayHoursResult, presentCountResult] =
    await Promise.all([
      builder.range(offset, offset + PAGE_SIZE - 1),
      editId
        ? supabase.from("attendance").select("*").eq("id", editId).maybeSingle()
        : Promise.resolve({ data: null }),
      getEmployeeOptions(),
      supabase
        .from("attendance")
        .select("total_hours")
        .eq("attendance_date", selectedDate),
      supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("attendance_date", selectedDate),
    ]);

  const hours = (dayHoursResult.data ?? [])
    .map((item) => item.total_hours ?? 0)
    .filter((value) => value > 0);
  const averageHours = hours.length
    ? Number((hours.reduce((sum, value) => sum + value, 0) / hours.length).toFixed(1))
    : 0;

  return {
    selectedDate,
    records: ((recordsResult.data ?? []) as AttendanceWithEmployee[]) ?? [],
    editingRecord: (editResult.data ?? null) as Tables<"attendance"> | null,
    employees: employeeOptions,
    pagination: buildPagination(recordsResult.count ?? 0, page ?? 1, PAGE_SIZE),
    summary: {
      presentToday: presentCountResult.count ?? 0,
      averageHours,
    },
  };
}

export async function getRecruitmentPageData({
  page,
  query,
  status,
  editId,
}: SearchParamsInput) {
  await requireProfile();
  const supabase = await createServerSupabaseClient();
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  let builder = supabase
    .from("candidates")
    .select("*", { count: "exact" })
    .order("call_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (query) {
    builder = builder.or(
      `name.ilike.%${query}%,phone.ilike.%${query}%,position.ilike.%${query}%`,
    );
  }

  if (status) {
    builder = builder.eq(
      "call_status",
      status as Tables<"candidates">["call_status"],
    );
  }

  const [
    listResult,
    editResult,
    totalCallsResult,
    interestedResult,
    joinedResult,
    followUpResult,
  ] = await Promise.all([
    builder.range(offset, offset + PAGE_SIZE - 1),
    editId
      ? supabase.from("candidates").select("*").eq("id", editId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("candidates").select("*", { count: "exact", head: true }),
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("call_status", "interested"),
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("final_status", "joined"),
    supabase
      .from("candidates")
      .select("*", { count: "exact", head: true })
      .eq("call_status", "follow_up"),
  ]);

  const totalCalls = totalCallsResult.count ?? 0;
  const joined = joinedResult.count ?? 0;

  return {
    candidates: (listResult.data ?? []) as Tables<"candidates">[],
    editingCandidate: (editResult.data ?? null) as Tables<"candidates"> | null,
    pagination: buildPagination(listResult.count ?? 0, page ?? 1, PAGE_SIZE),
    metrics: {
      totalCalls,
      interested: interestedResult.count ?? 0,
      followUps: followUpResult.count ?? 0,
      conversionRate: totalCalls === 0 ? 0 : Number(((joined / totalCalls) * 100).toFixed(1)),
    },
  };
}

export async function getTasksPageData({
  page,
  status,
  editId,
}: SearchParamsInput) {
  await requireProfile();
  const supabase = await createServerSupabaseClient();
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  let builder = supabase
    .from("tasks")
    .select("*", { count: "exact" })
    .order("status", { ascending: true })
    .order("deadline", { ascending: true });

  if (status) {
    builder = builder.eq("status", status as Tables<"tasks">["status"]);
  }

  const [listResult, editResult, completedResult, pendingResult, allTasksResult] =
    await Promise.all([
      builder.range(offset, offset + PAGE_SIZE - 1),
      editId
        ? supabase.from("tasks").select("*").eq("id", editId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("tasks").select("deadline, status"),
    ]);

  const today = startOfToday();
  const overdue = (allTasksResult.data ?? []).filter(
    (task) =>
      task.status !== "completed" &&
      task.deadline &&
      isBefore(new Date(task.deadline), today),
  ).length;

  return {
    tasks: (listResult.data ?? []) as Tables<"tasks">[],
    editingTask: (editResult.data ?? null) as Tables<"tasks"> | null,
    pagination: buildPagination(listResult.count ?? 0, page ?? 1, PAGE_SIZE),
    metrics: {
      completed: completedResult.count ?? 0,
      pending: pendingResult.count ?? 0,
      overdue,
    },
  };
}

export async function getLeavesPageData({ page, date }: SearchParamsInput) {
  await requireProfile();
  const supabase = await createServerSupabaseClient();
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  let builder = supabase
    .from("leaves")
    .select("*, employee:employees(id, name, role)", { count: "exact" })
    .order("date", { ascending: false });

  if (date) {
    builder = builder.eq("date", date);
  }

  const [listResult, employees] = await Promise.all([
    builder.range(offset, offset + PAGE_SIZE - 1),
    getEmployeeOptions(),
  ]);

  return {
    leaves: ((listResult.data ?? []) as LeaveWithEmployee[]) ?? [],
    employees,
    pagination: buildPagination(listResult.count ?? 0, page ?? 1, PAGE_SIZE),
  };
}

export async function getNotesForDate(date: string) {
  await requireProfile();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("note_date", date)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function buildDailyReportSummary(
  date: string,
  overallNotes = "",
): Promise<DailyReportSummary> {
  const { user, profile } = await requireProfile();
  const supabase = await createServerSupabaseClient();

  const [candidatesResult, attendanceResult, tasksResult, notesResult, employeesResult] =
    await Promise.all([
      supabase.from("candidates").select("*").eq("call_date", date),
      supabase
        .from("attendance")
        .select("*, employee:employees(name)")
        .eq("attendance_date", date),
      supabase.from("tasks").select("*"),
      supabase.from("notes").select("*").eq("note_date", date),
      supabase.from("employees").select("name").eq("status", "active"),
    ]);

  const candidates = candidatesResult.data ?? [];
  const attendance = ((attendanceResult.data ?? []) as (Tables<"attendance"> & {
    employee: Pick<Tables<"employees">, "name"> | null;
  })[]) ?? [];
  const tasks = tasksResult.data ?? [];
  const notes = notesResult.data ?? [];
  const activeEmployees = employeesResult.data ?? [];

  const joined = candidates.filter((candidate) => candidate.final_status === "joined").length;
  const interested = candidates.filter(
    (candidate) => candidate.call_status === "interested",
  ).length;
  const followUp = candidates.filter(
    (candidate) => candidate.call_status === "follow_up",
  ).length;
  const notInterested = candidates.filter(
    (candidate) => candidate.call_status === "not_interested",
  ).length;
  const completedTasks = tasks
    .filter((task) => task.status === "completed" && task.completed_at === date)
    .map((task) => task.title);
  const pendingTasks = tasks
    .filter((task) => task.status === "pending")
    .map((task) => task.title);
  const presentEmployees = attendance.map((entry) => entry.employee?.name ?? "Unknown employee");
  const absentEmployees = activeEmployees
    .map((employee) => employee.name)
    .filter((name) => !presentEmployees.includes(name));

  return {
    date,
    hrName: getUserLabel(profile, user.email),
    calls: {
      total: candidates.length,
      interested,
      followUp,
      notInterested,
      joined,
      conversionRate:
        candidates.length === 0
          ? 0
          : Number(((joined / candidates.length) * 100).toFixed(1)),
    },
    attendance: {
      presentCount: attendance.length,
      absentCount: absentEmployees.length,
      employees: presentEmployees,
      absentEmployees,
      locations: attendance
        .filter((entry) => entry.latitude && entry.longitude)
        .map((entry) => `${entry.employee?.name ?? "Unknown"}: ${entry.latitude}, ${entry.longitude}`),
    },
    tasks: {
      completed: completedTasks,
      pending: pendingTasks,
    },
    notes: notes
      .filter((note) => note.kind === "daily_note")
      .map((note) => `${note.title}: ${note.content}`),
    selfTasks: notes
      .filter((note) => note.kind === "self_task")
      .map((note) => `${note.title} (${note.status})`),
    overallNotes,
  };
}

export async function getReportsPageData({ page, date }: SearchParamsInput) {
  await requireProfile();
  const supabase = await createServerSupabaseClient();
  const selectedDate = date || dateKey(new Date());
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;

  const [reportsResult, preview] = await Promise.all([
    supabase
      .from("reports")
      .select("*", { count: "exact" })
      .order("date", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    buildDailyReportSummary(selectedDate),
  ]);

  const reports: ReportWithDownload[] = await Promise.all(
    ((reportsResult.data ?? []) as Tables<"reports">[]).map(async (report) => {
      const { data } = await supabase.storage
        .from(REPORT_STORAGE_BUCKET)
        .createSignedUrl(report.pdf_url, 3600);

      return {
        ...report,
        downloadUrl: data?.signedUrl ?? null,
        summary: report.summary_json as DailyReportSummary,
      };
    }),
  );

  return {
    selectedDate,
    preview,
    reports,
    pagination: buildPagination(reportsResult.count ?? 0, page ?? 1, PAGE_SIZE),
  };
}

export async function getSalariesPageData({ page, editId }: SearchParamsInput) {
  await requireProfile();
  const supabase = await createServerSupabaseClient();
  const offset = ((page ?? 1) - 1) * PAGE_SIZE;

  const [recordsResult, editResult, employees] = await Promise.all([
    supabase
      .from("salaries")
      .select("*, employee:employees(id, name, department)", { count: "exact" })
      .order("month", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    editId
      ? supabase.from("salaries").select("*").eq("id", editId).maybeSingle()
      : Promise.resolve({ data: null }),
    getEmployeeOptions(),
  ]);

  return {
    salaries: (recordsResult.data ?? []) as (Tables<"salaries"> & {
      employee: Pick<Tables<"employees">, "id" | "name" | "department"> | null;
    })[],
    editingSalary: (editResult.data ?? null) as Tables<"salaries"> | null,
    employees,
    pagination: buildPagination(recordsResult.count ?? 0, page ?? 1, PAGE_SIZE),
  };
}
