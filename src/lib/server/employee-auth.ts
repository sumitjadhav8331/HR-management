import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { sql } from "@/lib/server/postgres";

export type EmployeeAccount = Tables<"employees"> & {
  password_hash: string | null;
};

export function buildEmployeeProfile(employee: EmployeeAccount): Tables<"users"> {
  return {
    created_at: employee.created_at,
    email: employee.email ?? "",
    full_name: employee.name,
    id: employee.id,
    role: "employee",
    updated_at: employee.updated_at,
  };
}

export async function getEmployeeAccountById(employeeId: string) {
  const result = await sql<EmployeeAccount>(
    `
      select *
      from public.employees
      where id = $1
      limit 1
    `,
    [employeeId],
  );

  return result.rows[0] ?? null;
}

export async function findEmployeeAccountsByEmail(email: string) {
  const result = await sql<EmployeeAccount>(
    `
      select *
      from public.employees
      where email is not null
        and lower(email) = lower($1)
      order by created_at desc
      limit 2
    `,
    [email],
  );

  return result.rows;
}
