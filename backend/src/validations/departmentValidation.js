import { z } from "zod";

// Create department validation schema
export const createDepartmentSchema = z.object({
  body: z.object({
    dept_name: z
      .string()
      .min(2, { message: "Department name must be at least 2 characters long" })
      .max(100, { message: "Department name cannot exceed 100 characters" })
      .trim(),
    description: z
      .string()
      .max(500, { message: "Description cannot exceed 500 characters" })
      .optional(),
    dept_head_id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid employee ID format" })
      .optional(),
  }),
});

// Update department validation schema
export const updateDepartmentSchema = z.object({
  body: z.object({
    dept_name: z
      .string()
      .min(2, { message: "Department name must be at least 2 characters long" })
      .max(100, { message: "Department name cannot exceed 100 characters" })
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, { message: "Description cannot exceed 500 characters" })
      .optional(),
    dept_head_id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid employee ID format" })
      .optional(),
  }),
});

// Assign department head validation schema
export const assignDeptHeadSchema = z.object({
  body: z.object({
    dept_head_id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid employee ID format" }),
  }),
});
