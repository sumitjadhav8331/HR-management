import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const EMPLOYEE_SESSION_COOKIE = "employee_session";
const EMPLOYEE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type EmployeeSessionPayload = {
  employeeId: string;
  expiresAt: number;
  issuedAt: number;
  version: 1;
};

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET;

  if (!secret) {
    throw new Error("APP_SESSION_SECRET is required for employee login sessions.");
  }

  return secret;
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function encodeSession(payload: EmployeeSessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function decodeSession(sessionToken: string) {
  const [encodedPayload, signature] = sessionToken.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const providedSignature = Buffer.from(signature, "base64url");
  const actualSignature = Buffer.from(expectedSignature, "base64url");

  if (
    providedSignature.length !== actualSignature.length ||
    !timingSafeEqual(providedSignature, actualSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as EmployeeSessionPayload;

    if (
      payload.version !== 1 ||
      typeof payload.employeeId !== "string" ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number"
    ) {
      return null;
    }

    if (payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getEmployeeSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(EMPLOYEE_SESSION_COOKIE)?.value;

  if (!rawSession) {
    return null;
  }

  return decodeSession(rawSession);
}

export async function createEmployeeSession(employeeId: string) {
  const cookieStore = await cookies();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + EMPLOYEE_SESSION_MAX_AGE_SECONDS * 1000;

  cookieStore.set(EMPLOYEE_SESSION_COOKIE, encodeSession({
    employeeId,
    expiresAt,
    issuedAt,
    version: 1,
  }), {
    expires: new Date(expiresAt),
    httpOnly: true,
    maxAge: EMPLOYEE_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearEmployeeSession() {
  const cookieStore = await cookies();
  cookieStore.delete(EMPLOYEE_SESSION_COOKIE);
}
