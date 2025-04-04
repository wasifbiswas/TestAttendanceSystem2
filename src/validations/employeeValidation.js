import { z } from "zod";

// Create employee validation schema
export const createEmployeeSchema = z.object({
  user_id: z.string().min(1, "User ID is required"),
  dept_id: z.string().min(1, "Department ID is required"),
  designation: z
    .string()
    .min(2, "Designation must be at least 2 characters long")
    .max(100, "Designation must be at most 100 characters long")
    .trim(),
  hire_date: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  employee_code: z
    .string()
    .min(3, "Employee code must be at least 3 characters long")
    .max(20, "Employee code must be at most 20 characters long")
    .trim()
    .optional(),
  reporting_manager_id: z.string().optional(),
});

// Update employee validation schema
export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .omit({ user_id: true, employee_code: true });

// Transfer employee validation schema
export const transferEmployeeSchema = z.object({
  emp_id: z.string().min(1, "Employee ID is required"),
  new_dept_id: z.string().min(1, "New department ID is required"),
  new_designation: z.string().optional(),
  new_reporting_manager_id: z.string().optional(),
  transfer_date: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  reason: z.string().optional(),
});

// Assign manager validation schema
export const assignManagerSchema = z.object({
  emp_id: z.string().min(1, "Employee ID is required"),
  manager_id: z.string().min(1, "Manager ID is required"),
});
