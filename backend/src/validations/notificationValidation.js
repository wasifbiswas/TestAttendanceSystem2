import { z } from "zod";

// Create notification validation schema
export const createNotificationSchema = z
  .object({
    title: z
      .string()
      .min(3, { message: "Title must be at least 3 characters long" })
      .max(100, { message: "Title cannot exceed 100 characters" }),
    message: z
      .string()
      .min(5, { message: "Message must be at least 5 characters long" })
      .max(500, { message: "Message cannot exceed 500 characters" }),
    recipients: z.array(z.string()).optional(),
    department_id: z.string().optional(),
    all_employees: z.boolean().optional().default(false),
    priority: z
      .enum(["low", "medium", "high"], {
        message: "Priority must be one of: low, medium, high",
      })
      .optional()
      .default("medium"),
    expires_at: z
      .string()
      .datetime({ message: "Expiration date must be a valid date" })
      .optional(),
  })
  .refine(
    (data) =>
      data.recipients?.length > 0 || data.department_id || data.all_employees,
    {
      message:
        "You must specify either recipients, a department, or all_employees flag",
      path: ["recipients"],
    }
  );
