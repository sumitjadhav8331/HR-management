import { format, isValid, parseISO } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PaginationState } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function normalizeDate(value?: Date | string | null) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatDate(value?: Date | string | null, pattern = "dd MMM yyyy") {
  const normalized = normalizeDate(value);
  return normalized ? format(normalized, pattern) : "—";
}

export function formatDateTime(value?: Date | string | null) {
  return formatDate(value, "dd MMM yyyy, hh:mm a");
}

export function dateKey(value?: Date | string | null) {
  const normalized = normalizeDate(value);
  return normalized ? format(normalized, "yyyy-MM-dd") : "";
}

export function parsePage(value?: string) {
  const page = Number(value ?? 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function buildPagination(
  total: number,
  page: number,
  pageSize: number,
): PaginationState {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function formatHours(value?: number | null) {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(1)} hrs`;
}

export function formatCount(value?: number | null) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

export function getReadableName(fullName?: string | null, email?: string | null) {
  if (fullName?.trim()) {
    return fullName;
  }

  if (!email) {
    return "HR User";
  }

  return email.split("@")[0].replace(/[._-]/g, " ");
}

export function getInitials(label?: string | null) {
  const safeLabel = label?.trim();

  if (!safeLabel) {
    return "HR";
  }

  const parts = safeLabel.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function toSentenceCase(value?: string | null) {
  if (!value) {
    return "";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildPageHref(
  pathname: string,
  searchParams: URLSearchParams,
  page: number,
) {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("page", String(page));
  return `${pathname}?${nextParams.toString()}`;
}
