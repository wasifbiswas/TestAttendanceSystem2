import { z } from "zod";

// Create employee validation schema
export const createEmployeeSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  employeeId: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Employee ID must contain only letters and numbers",
    }),
  department: z.string().min(1, { message: "Department is required" }),
  role: z.string().min(1, { message: "Role is required" }),
  position: z.string().min(1, { message: "Position is required" }),
  phoneNumber: z
    .string()
    .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
      message: "Please enter a valid phone number",
    })
    .optional(),
  address: z.string().optional(),
  salary: z
    .number()
    .positive({ message: "Salary must be a positive number" })
    .optional(),
  joinDate: z
    .string()
    .datetime({ message: "Join date must be a valid date" })
    .optional(),
});

// Update employee validation schema
export const updateEmployeeSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .optional(),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  position: z.string().optional(),
  phoneNumber: z
    .string()
    .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
      message: "Please enter a valid phone number",
    })
    .optional(),
  address: z.string().optional(),
  salary: z
    .number()
    .positive({ message: "Salary must be a positive number" })
    .optional(),
  status: z
    .enum(["active", "inactive", "on_leave"], {
      message: "Status must be one of: active, inactive, on_leave",
    })
    .optional(),
});

// Assign manager validation schema
export const assignManagerSchema = z.object({
  managerId: z.string().min(1, { message: "Manager ID is required" }),
});
