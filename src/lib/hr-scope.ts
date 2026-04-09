import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

export type HrEmployeeOption = Pick<Tables<"employees">, "id" | "name" | "role" | "status">;

export async function listHrEmployees(
  supabase: AppSupabaseClient,
  hrUserId: string,
) {
  const result = await supabase
    .from("employees")
    .select("id, name, role, status")
    .eq("created_by", hrUserId)
    .order("name", { ascending: true });

  return {
    data: (result.data ?? []) as HrEmployeeOption[],
    error: result.error,
  };
}

export async function hrOwnsEmployee(
  supabase: AppSupabaseClient,
  hrUserId: string,
  employeeId: string,
) {
  const result = await supabase
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("created_by", hrUserId)
    .maybeSingle();

  return {
    data: Boolean(result.data),
    error: result.error,
  };
}
