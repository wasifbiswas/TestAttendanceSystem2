import { z } from "zod";

// Check-in validation schema
export const checkInSchema = z.object({
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  notes: z
    .string()
    .max(255, { message: "Notes cannot exceed 255 characters" })
    .optional(),
});

// Check-out validation schema
export const checkOutSchema = z.object({
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  notes: z
    .string()
    .max(255, { message: "Notes cannot exceed 255 characters" })
    .optional(),
});

// Create attendance record validation schema
export const createAttendanceSchema = z.object({
  employeeId: z.string().min(1, { message: "Employee ID is required" }),
  date: z.string().datetime({ message: "Date must be a valid date" }),
  checkIn: z
    .string()
    .datetime({ message: "Check-in time must be a valid datetime" }),
  checkOut: z
    .string()
    .datetime({ message: "Check-out time must be a valid datetime" })
    .optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LATE", "ON_LEAVE"], {
    message: "Status must be one of: PRESENT, ABSENT, HALF_DAY, LATE, ON_LEAVE",
  }),
  notes: z
    .string()
    .max(255, { message: "Notes cannot exceed 255 characters" })
    .optional(),
});

// Update attendance record validation schema
export const updateAttendanceSchema = z.object({
  checkIn: z
    .string()
    .datetime({ message: "Check-in time must be a valid datetime" })
    .optional(),
  checkOut: z
    .string()
    .datetime({ message: "Check-out time must be a valid datetime" })
    .optional(),
  status: z
    .enum(["PRESENT", "ABSENT", "HALF_DAY", "LATE", "ON_LEAVE"], {
      message:
        "Status must be one of: PRESENT, ABSENT, HALF_DAY, LATE, ON_LEAVE",
    })
    .optional(),
  notes: z
    .string()
    .max(255, { message: "Notes cannot exceed 255 characters" })
    .optional(),
});

// Bulk attendance creation validation schema
export const bulkAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        employeeId: z.string().min(1, { message: "Employee ID is required" }),
        date: z.string().datetime({ message: "Date must be a valid date" }),
        status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LATE", "ON_LEAVE"], {
          message:
            "Status must be one of: PRESENT, ABSENT, HALF_DAY, LATE, ON_LEAVE",
        }),
        checkIn: z
          .string()
          .datetime({ message: "Check-in time must be a valid datetime" })
          .optional(),
        checkOut: z
          .string()
          .datetime({ message: "Check-out time must be a valid datetime" })
          .optional(),
        notes: z
          .string()
          .max(255, { message: "Notes cannot exceed 255 characters" })
          .optional(),
      })
    )
    .min(1, { message: "At least one attendance record is required" }),
});
