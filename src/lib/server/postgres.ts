import "server-only";

import { Pool, type QueryResult, types } from "pg";
import { assertPostgresEnv, getPostgresConnectionString } from "@/lib/server/runtime-env";

types.setTypeParser(1700, (value) => Number(value));

declare global {
  var __hrManagementPgPool: Pool | undefined;
}

export function getPostgresPool() {
  if (!global.__hrManagementPgPool) {
    assertPostgresEnv();

    global.__hrManagementPgPool = new Pool({
      connectionString: getPostgresConnectionString()!,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return global.__hrManagementPgPool;
}

export async function sql<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
) {
  return getPostgresPool().query<T>(text, values) as Promise<QueryResult<T>>;
}
