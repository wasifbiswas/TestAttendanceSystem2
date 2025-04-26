// User authentication validation schemas
import { z } from "zod";

// User registration validation
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(50, { message: "Username cannot exceed 50 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  confirm_password: z.string().optional(),
  full_name: z
    .string()
    .min(3, { message: "Full name must be at least 3 characters long" })
    .max(100, { message: "Full name cannot exceed 100 characters" }),
  contact_number: z.string().optional(),
  department: z.string().optional(),
});

// User login validation
export const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Change password validation
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(6, { message: "New password must be at least 6 characters long" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm password is required" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Update user profile validation
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
  phoneNumber: z
    .string()
    .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
      message: "Please enter a valid phone number",
    })
    .optional(),
  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters long" })
    .optional(),
});
