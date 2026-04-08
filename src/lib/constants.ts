export const PAGE_SIZE = 8;
export const REPORT_STORAGE_BUCKET = "daily-reports";

export const employeeStatuses = ["active", "not_joined", "left"] as const;
export const candidateCallStatuses = [
  "interested",
  "not_interested",
  "follow_up",
] as const;
export const candidateFinalStatuses = [
  "joined",
  "not_joined",
  "pending",
] as const;
export const taskPriorities = ["low", "medium", "high", "urgent"] as const;
export const taskStatuses = ["pending", "completed"] as const;
export const noteKinds = ["daily_note", "self_task"] as const;
export const noteStatuses = ["open", "done"] as const;
export const userRoles = ["hr", "employee"] as const;
export const leaveStatuses = ["pending", "approved", "rejected"] as const;
export const salaryPaymentStatuses = ["pending", "paid"] as const;
