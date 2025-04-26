import { z } from "zod";

// Create department validation schema
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Department name must be at least 2 characters long" })
    .max(50, { message: "Department name cannot exceed 50 characters" }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  location: z
    .string()
    .max(100, { message: "Location cannot exceed 100 characters" })
    .optional(),
  budget: z
    .number()
    .nonnegative({ message: "Budget must be a non-negative number" })
    .optional(),
});

// Update department validation schema
export const updateDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Department name must be at least 2 characters long" })
    .max(50, { message: "Department name cannot exceed 50 characters" })
    .optional(),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional(),
  location: z
    .string()
    .max(100, { message: "Location cannot exceed 100 characters" })
    .optional(),
  budget: z
    .number()
    .nonnegative({ message: "Budget must be a non-negative number" })
    .optional(),
  status: z
    .enum(["active", "inactive"], {
      message: "Status must be one of: active, inactive",
    })
    .optional(),
});

// Assign department head validation schema
export const assignDeptHeadSchema = z.object({
  employeeId: z.string().min(1, { message: "Employee ID is required" }),
});
