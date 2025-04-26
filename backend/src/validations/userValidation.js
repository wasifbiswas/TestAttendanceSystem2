import { z } from "zod";

// Admin update user validation schema
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .optional(),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional(),
  role: z.string().min(1, { message: "Role is required" }).optional(),
  department: z
    .string()
    .min(1, { message: "Department is required" })
    .optional(),
  status: z
    .enum(["active", "inactive", "suspended"], {
      message: "Status must be one of: active, inactive, suspended",
    })
    .optional(),
  isAdmin: z.boolean().optional(),
});
