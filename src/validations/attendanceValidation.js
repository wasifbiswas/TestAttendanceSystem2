import { z } from "zod";

// Create attendance validation schema
export const createAttendanceSchema = z.object({
  emp_id: z.string().min(1, "Employee ID is required"),
  attendance_date: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  check_in: z.string().datetime().optional(),
  check_out: z.string().datetime().optional(),
  status: z
    .enum(["PRESENT", "ABSENT", "LEAVE", "HOLIDAY", "HALF_DAY", "WEEKEND"])
    .default("PRESENT"),
  is_leave: z.boolean().default(false),
  leave_request_id: z.string().optional(),
  remarks: z.string().optional(),
});

// Update attendance validation schema
export const updateAttendanceSchema = z.object({
  check_in: z.string().datetime().optional(),
  check_out: z.string().datetime().optional(),
  status: z
    .enum(["PRESENT", "ABSENT", "LEAVE", "HOLIDAY", "HALF_DAY", "WEEKEND"])
    .optional(),
  is_leave: z.boolean().optional(),
  leave_request_id: z.string().optional(),
  remarks: z.string().optional(),
});

// Check-in validation schema
export const checkInSchema = z.object({
  emp_id: z.string().min(1, "Employee ID is required"),
  check_in: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  remarks: z.string().optional(),
});

// Check-out validation schema
export const checkOutSchema = z.object({
  emp_id: z.string().min(1, "Employee ID is required"),
  check_out: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  remarks: z.string().optional(),
});

// Bulk attendance update validation schema
export const bulkAttendanceSchema = z.object({
  emp_ids: z.array(z.string()),
  attendance_date: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  status: z
    .enum(["PRESENT", "ABSENT", "LEAVE", "HOLIDAY", "HALF_DAY", "WEEKEND"])
    .default("PRESENT"),
  remarks: z.string().optional(),
});
