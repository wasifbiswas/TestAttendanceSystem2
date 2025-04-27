import express from "express";
import {
  getAttendanceSummary,
  getUserLeaves,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all user routes
router.use(protect);

// Get user's attendance summary
router.get("/attendance/summary", getAttendanceSummary);

// Get user's leave requests
router.get("/leaves", getUserLeaves);

export default router;
