// validations/leaveValidation.js
import { z } from "zod";

// Create leave request validation schema
export const createLeaveRequestSchema = z
  .object({
    emp_id: z.string().min(1, "Employee ID is required"),
    leave_type_id: z.string().min(1, "Leave type ID is required"),
    start_date: z.string().datetime("Start date must be a valid date"),
    end_date: z.string().datetime("End date must be a valid date"),
    duration: z.number().min(0.5, "Duration must be at least 0.5 days"),
    reason: z
      .string()
      .min(3, "Reason must be at least 3 characters long")
      .max(500, "Reason must be at most 500 characters long")
      .trim(),
    status: z
      .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
      .default("PENDING"),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return startDate <= endDate;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["end_date"],
    }
  );

// Update leave request validation schema
export const updateLeaveRequestSchema = z.object({
  start_date: z.string().datetime("Start date must be a valid date").optional(),
  end_date: z.string().datetime("End date must be a valid date").optional(),
  duration: z
    .number()
    .min(0.5, "Duration must be at least 0.5 days")
    .optional(),
  reason: z
    .string()
    .min(3, "Reason must be at least 3 characters long")
    .max(500, "Reason must be at most 500 characters long")
    .trim()
    .optional(),
});

// Leave approval validation schema
export const leaveApprovalSchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  status: z.enum(["APPROVED", "REJECTED"]).default("APPROVED"),
  rejection_reason: z
    .string()
    .max(500, "Rejection reason must be at most 500 characters long")
    .trim()
    .optional(),
});

// Leave balance validation schema
export const createLeaveBalanceSchema = z.object({
  emp_id: z.string().min(1, "Employee ID is required"),
  leave_type_id: z.string().min(1, "Leave type ID is required"),
  year: z.number().min(2000, "Year must be 2000 or later"),
  allocated_leaves: z.number().min(0, "Allocated leaves cannot be negative"),
  carried_forward: z
    .number()
    .min(0, "Carried forward leaves cannot be negative")
    .default(0),
});
