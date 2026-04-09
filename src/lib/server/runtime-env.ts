import "server-only";

const POSTGRES_ENV_KEYS = [
  "DIRECT_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
] as const;

const EMPLOYEE_SESSION_SECRET_KEYS = [
  "APP_SESSION_SECRET",
  "AUTH_SECRET",
] as const;

function getFirstServerEnvValue(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

export function getPostgresConnectionString() {
  return getFirstServerEnvValue(POSTGRES_ENV_KEYS);
}

export function isPostgresConfigured() {
  return Boolean(getPostgresConnectionString());
}

export function getPostgresEnvErrorMessage() {
  return "Postgres is not configured. Add DIRECT_URL, DATABASE_URL, or a Vercel Postgres URL variable such as POSTGRES_URL or POSTGRES_URL_NON_POOLING.";
}

export function assertPostgresEnv() {
  if (!isPostgresConfigured()) {
    throw new Error(getPostgresEnvErrorMessage());
  }
}

export function getEmployeeSessionSecret() {
  return getFirstServerEnvValue(EMPLOYEE_SESSION_SECRET_KEYS);
}

export function isEmployeeSessionConfigured() {
  return Boolean(getEmployeeSessionSecret());
}

export function getEmployeeSessionEnvErrorMessage() {
  return "Employee login sessions are not configured. Add APP_SESSION_SECRET to your environment.";
}

export function assertEmployeeSessionEnv() {
  if (!isEmployeeSessionConfigured()) {
    throw new Error(getEmployeeSessionEnvErrorMessage());
  }
}
