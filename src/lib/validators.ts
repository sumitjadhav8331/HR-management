import { z } from "zod";
import {
  candidateCallStatuses,
  candidateFinalStatuses,
  employeeStatuses,
  noteKinds,
  noteStatuses,
  taskPriorities,
  taskStatuses,
} from "@/lib/constants";

const optionalEmailSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || z.string().email().safeParse(value).success,
    "Enter a valid email address.",
  );

const optionalDateSchema = z.string().trim();

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const signupSchema = loginSchema.extend({
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters."),
});

export const employeeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  phone: z.string().trim().min(8, "Phone number is required."),
  email: optionalEmailSchema,
  role: z.string().trim().min(2, "Role is required."),
  joining_date: z.string().trim().min(1, "Joining date is required."),
  status: z.enum(employeeStatuses),
});

export const attendanceSchema = z
  .object({
    employee_id: z.string().uuid("Select an employee."),
    attendance_date: z.string().trim().min(1, "Attendance date is required."),
    login_time: z.string().trim().min(1, "Login time is required."),
    logout_time: z.string().trim().optional(),
  })
  .refine(
    (value) =>
      !value.logout_time ||
      new Date(value.logout_time).getTime() >= new Date(value.login_time).getTime(),
    {
      path: ["logout_time"],
      message: "Logout time must be later than login time.",
    },
  );

export const candidateSchema = z.object({
  name: z.string().trim().min(2, "Candidate name is required."),
  phone: z.string().trim().min(8, "Phone number is required."),
  position: z.string().trim().min(2, "Position is required."),
  call_status: z.enum(candidateCallStatuses),
  response: z.string().trim().optional(),
  expected_joining_date: optionalDateSchema.optional(),
  final_status: z.enum(candidateFinalStatuses),
  call_date: z.string().trim().min(1, "Call date is required."),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Task title is required."),
  description: z.string().trim().optional(),
  status: z.enum(taskStatuses).default("pending"),
  priority: z.enum(taskPriorities),
  deadline: optionalDateSchema.optional(),
});

export const leaveSchema = z.object({
  employee_id: z.string().uuid("Select an employee."),
  date: z.string().trim().min(1, "Leave date is required."),
  reason: z.string().trim().min(3, "Leave reason is required."),
});

export const noteSchema = z.object({
  title: z.string().trim().min(2, "Title is required."),
  content: z.string().trim().min(3, "Content is required."),
  kind: z.enum(noteKinds),
  note_date: z.string().trim().min(1, "Date is required."),
  status: z.enum(noteStatuses).default("open"),
});

export const reportSchema = z.object({
  date: z.string().trim().min(1, "Report date is required."),
  overall_notes: z.string().trim().optional(),
});
