import { z } from "zod";

// Create department validation schema
export const createDepartmentSchema = z.object({
  dept_name: z
    .string()
    .min(2, "Department name must be at least 2 characters long")
    .max(100, "Department name must be at most 100 characters long")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters long")
    .trim()
    .optional(),
  dept_head_id: z.string().optional(),
});

// Update department validation schema
export const updateDepartmentSchema = createDepartmentSchema.partial();

// Assign department head validation schema
export const assignDeptHeadSchema = z.object({
  dept_id: z.string().min(1, "Department ID is required"),
  dept_head_id: z.string().min(1, "Department head ID is required"),
});
