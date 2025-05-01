import { z } from "zod";

// Create leave request validation schema
export const createLeaveRequestSchema = z
  .object({
    emp_id: z.string().min(1, { message: "Employee ID is required" }),
    leave_type_id: z.string().min(1, { message: "Leave type ID is required" }),
    start_date: z
      .string()
      .datetime({ message: "Start date must be a valid date" }),
    end_date: z.string().datetime({ message: "End date must be a valid date" }),
    duration: z
      .number()
      .positive({ message: "Duration must be a positive number" }),
    reason: z
      .string()
      .min(5, { message: "Reason must be at least 5 characters long" })
      .max(500, { message: "Reason cannot exceed 500 characters" }),
    is_half_day: z.boolean().optional(),
    contact_during_leave: z.string().optional(),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: "End date must be after or equal to start date",
    path: ["end_date"],
  });

// Update leave request validation schema
export const updateLeaveRequestSchema = z.object({
  leaveType: z.string().optional(),
  startDate: z
    .string()
    .datetime({ message: "Start date must be a valid date" })
    .optional(),
  endDate: z
    .string()
    .datetime({ message: "End date must be a valid date" })
    .optional(),
  reason: z
    .string()
    .min(5, { message: "Reason must be at least 5 characters long" })
    .max(500, { message: "Reason cannot exceed 500 characters" })
    .optional(),
  attachmentUrl: z
    .string()
    .url({ message: "Attachment URL must be a valid URL" })
    .optional(),
});

// Leave approval validation schema
export const leaveApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"], {
    message: "Status must be one of: APPROVED, REJECTED, PENDING",
  }),
  comments: z
    .string()
    .max(500, { message: "Comments cannot exceed 500 characters" })
    .optional(),
});

// Create/update leave balance validation schema
export const createLeaveBalanceSchema = z.object({
  leaveType: z.string().min(1, { message: "Leave type is required" }),
  balance: z
    .number()
    .nonnegative({ message: "Balance must be a non-negative number" }),
  allocated: z
    .number()
    .nonnegative({ message: "Allocated days must be a non-negative number" })
    .optional(),
  used: z
    .number()
    .nonnegative({ message: "Used days must be a non-negative number" })
    .optional(),
});
