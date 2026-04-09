import "server-only";

import { Pool, type QueryResult, types } from "pg";

types.setTypeParser(1700, (value) => Number(value));

declare global {
  var __hrManagementPgPool: Pool | undefined;
}

function getConnectionString() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Postgres is not configured. Add DIRECT_URL or DATABASE_URL to .env.local.");
  }

  return connectionString;
}

export function getPostgresPool() {
  if (!global.__hrManagementPgPool) {
    global.__hrManagementPgPool = new Pool({
      connectionString: getConnectionString(),
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
