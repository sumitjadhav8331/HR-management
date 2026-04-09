import { isBefore, startOfToday } from "date-fns";
import { requireEmployeeProfile } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/constants";
import { sql } from "@/lib/server/postgres";
import type { Tables } from "@/lib/supabase/database.types";
import { buildPagination, dateKey } from "@/lib/utils";

type CountRow = {
  count: number;
};

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
    sql<Tables<"attendance">>(
      `
        select *
        from public.attendance
        where employee_id = $1
          and attendance_date = $2
        order by login_time desc
        limit 1
      `,
      [employee.id, today],
    ),
    sql<CountRow>(
      `
        select count(*)::int as count
        from public.tasks
        where assigned_to = $1
          and status = 'pending'
      `,
      [employee.id],
    ),
    sql<CountRow>(
      `
        select count(*)::int as count
        from public.tasks
        where assigned_to = $1
          and status = 'completed'
      `,
      [employee.id],
    ),
    sql<CountRow>(
      `
        select count(*)::int as count
        from public.leaves
        where employee_id = $1
          and status = 'pending'
      `,
      [employee.id],
    ),
    sql<Tables<"tasks">>(
      `
        select *
        from public.tasks
        where assigned_to = $1
        order by status asc, deadline asc nulls last
        limit 5
      `,
      [employee.id],
    ),
    sql<Tables<"leaves">>(
      `
        select *
        from public.leaves
        where employee_id = $1
        order by date desc
        limit 5
      `,
      [employee.id],
    ),
    sql<Tables<"salaries">>(
      `
        select *
        from public.salaries
        where employee_id = $1
        order by month desc
        limit 1
      `,
      [employee.id],
    ),
  ]);

  return {
    employee,
    latestSalary: latestSalaryResult.rows[0] ?? null,
    metrics: {
      completedTasks: completedTasksResult.rows[0]?.count ?? 0,
      pendingLeaves: pendingLeavesResult.rows[0]?.count ?? 0,
      pendingTasks: pendingTasksResult.rows[0]?.count ?? 0,
    },
    profile,
    recentLeaves: recentLeavesResult.rows,
    tasks: tasksResult.rows,
    todayAttendance: todayAttendanceResult.rows[0] ?? null,
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

  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  const todayDate = dateKey(new Date());

  const [todayResult, countResult, recordsResult] = await Promise.all([
    sql<Tables<"attendance">>(
      `
        select *
        from public.attendance
        where employee_id = $1
          and attendance_date = $2
        order by login_time desc
        limit 1
      `,
      [employee.id, todayDate],
    ),
    sql<CountRow>(
      `
        select count(*)::int as count
        from public.attendance
        where employee_id = $1
      `,
      [employee.id],
    ),
    sql<Tables<"attendance">>(
      `
        select *
        from public.attendance
        where employee_id = $1
        order by attendance_date desc, login_time desc
        limit $2
        offset $3
      `,
      [employee.id, PAGE_SIZE, offset],
    ),
  ]);

  return {
    employee,
    pagination: buildPagination(countResult.rows[0]?.count ?? 0, page ?? 1, PAGE_SIZE),
    records: recordsResult.rows,
    todayDate,
    todayRecord: todayResult.rows[0] ?? null,
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

  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  const filters = ["assigned_to = $1"];
  const values: Array<string | number> = [employee.id];

  if (status) {
    values.push(status);
    filters.push(`status = $${values.length}`);
  }

  const whereClause = filters.join(" and ");

  const [listResult, totalResult, completedResult, pendingResult, allTasksResult] =
    await Promise.all([
      sql<Tables<"tasks">>(
        `
          select *
          from public.tasks
          where ${whereClause}
          order by status asc, deadline asc nulls last
          limit $${values.length + 1}
          offset $${values.length + 2}
        `,
        [...values, PAGE_SIZE, offset],
      ),
      sql<CountRow>(
        `
          select count(*)::int as count
          from public.tasks
          where ${whereClause}
        `,
        values,
      ),
      sql<CountRow>(
        `
          select count(*)::int as count
          from public.tasks
          where assigned_to = $1
            and status = 'completed'
        `,
        [employee.id],
      ),
      sql<CountRow>(
        `
          select count(*)::int as count
          from public.tasks
          where assigned_to = $1
            and status = 'pending'
        `,
        [employee.id],
      ),
      sql<Pick<Tables<"tasks">, "deadline" | "status">>(
        `
          select deadline, status
          from public.tasks
          where assigned_to = $1
        `,
        [employee.id],
      ),
    ]);

  const today = startOfToday();
  const overdue = allTasksResult.rows.filter(
    (task) =>
      task.status !== "completed" &&
      task.deadline &&
      isBefore(new Date(task.deadline), today),
  ).length;

  return {
    employee,
    metrics: {
      completed: completedResult.rows[0]?.count ?? 0,
      overdue,
      pending: pendingResult.rows[0]?.count ?? 0,
    },
    pagination: buildPagination(totalResult.rows[0]?.count ?? 0, page ?? 1, PAGE_SIZE),
    tasks: listResult.rows,
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

  const offset = ((page ?? 1) - 1) * PAGE_SIZE;

  const [listResult, totalResult, pendingResult, approvedResult, rejectedResult] =
    await Promise.all([
      sql<Tables<"leaves">>(
        `
          select *
          from public.leaves
          where employee_id = $1
          order by date desc
          limit $2
          offset $3
        `,
        [employee.id, PAGE_SIZE, offset],
      ),
      sql<CountRow>(
        `
          select count(*)::int as count
          from public.leaves
          where employee_id = $1
        `,
        [employee.id],
      ),
      sql<CountRow>(
        `
          select count(*)::int as count
          from public.leaves
          where employee_id = $1
            and status = 'pending'
        `,
        [employee.id],
      ),
      sql<CountRow>(
        `
          select count(*)::int as count
          from public.leaves
          where employee_id = $1
            and status = 'approved'
        `,
        [employee.id],
      ),
      sql<CountRow>(
        `
          select count(*)::int as count
          from public.leaves
          where employee_id = $1
            and status = 'rejected'
        `,
        [employee.id],
      ),
    ]);

  return {
    employee,
    leaves: listResult.rows,
    metrics: {
      approved: approvedResult.rows[0]?.count ?? 0,
      pending: pendingResult.rows[0]?.count ?? 0,
      rejected: rejectedResult.rows[0]?.count ?? 0,
    },
    pagination: buildPagination(totalResult.rows[0]?.count ?? 0, page ?? 1, PAGE_SIZE),
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

  const offset = ((page ?? 1) - 1) * PAGE_SIZE;
  const [countResult, listResult] = await Promise.all([
    sql<CountRow>(
      `
        select count(*)::int as count
        from public.salaries
        where employee_id = $1
      `,
      [employee.id],
    ),
    sql<Tables<"salaries">>(
      `
        select *
        from public.salaries
        where employee_id = $1
        order by month desc
        limit $2
        offset $3
      `,
      [employee.id, PAGE_SIZE, offset],
    ),
  ]);

  return {
    employee,
    pagination: buildPagination(countResult.rows[0]?.count ?? 0, page ?? 1, PAGE_SIZE),
    salaries: listResult.rows,
  };
}
