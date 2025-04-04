import { z } from "zod";

// Create user validation schema
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(50, "Username must be at most 50 characters long")
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be at most 100 characters long"),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name must be at most 100 characters long")
    .trim(),
  join_date: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  is_active: z.boolean().default(true),
  contact_number: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
      "Invalid phone number format"
    )
    .optional(),
});

// Update user validation schema
export const updateUserSchema = createUserSchema
  .partial()
  .omit({ password: true });

// Password change validation schema
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .max(100, "New password must be at most 100 characters long"),
    confirm_password: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "New password and confirmation don't match",
    path: ["confirm_password"],
  });

// Login validation schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
