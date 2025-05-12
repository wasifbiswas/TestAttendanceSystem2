import express from "express";
import {
  getAllAttendance,
  getEmployeeAttendance,
  getAttendanceByDate,
  getTodayAttendance,
  createAttendance,
  checkIn,
  checkOut,
  updateAttendance,
  deleteAttendance,
  bulkCreateAttendance,
} from "../controllers/attendanceController.js";
import { getAttendanceSummary } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin, manager, selfOrManager } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  checkInSchema,
  checkOutSchema,
  bulkAttendanceSchema,
} from "../validations/attendanceValidation.js";

const router = express.Router();

// Get all attendance records (admin only)
router.get("/", protect, admin, getAllAttendance);

// Get today's attendance (admin and managers)
router.get("/today", protect, manager, getTodayAttendance);

// Get attendance summary for current user
router.get("/summary", protect, getAttendanceSummary);

// Check-in and check-out routes
router.post("/check-in", protect, validate(checkInSchema), checkIn);
router.post("/check-out", protect, validate(checkOutSchema), checkOut);

// Get attendance for a specific date
router.get("/date/:date", protect, manager, getAttendanceByDate);

// Bulk create attendance records
router.post(
  "/bulk",
  protect,
  admin,
  validate(bulkAttendanceSchema),
  bulkCreateAttendance
);

// Get employee attendance
router.get(
  "/employee/:employeeId",
  protect,
  selfOrManager,
  getEmployeeAttendance
);

// Manage individual attendance records
router
  .route("/:id")
  .put(protect, admin, validate(updateAttendanceSchema), updateAttendance)
  .delete(protect, admin, deleteAttendance);

// Create attendance record (admin only)
router.post(
  "/",
  protect,
  admin,
  validate(createAttendanceSchema),
  createAttendance
);

export default router;
