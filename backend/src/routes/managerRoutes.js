import express from "express";
import {
  getDepartmentStats,
  getDepartmentEmployees,
  getDepartmentLeaveRequests,
  approveDepartmentLeaveRequest,
  rejectDepartmentLeaveRequest
} from "../controllers/managerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { manager } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication and manager role
router.use(protect, manager);

// @desc    Get department statistics for manager's department
// @route   GET /api/manager/department-stats
// @access  Private/Manager
router.get("/department-stats", getDepartmentStats);

// @desc    Get employees in manager's department
// @route   GET /api/manager/employees
// @access  Private/Manager
router.get("/employees", getDepartmentEmployees);

// @desc    Get leave requests for manager's department
// @route   GET /api/manager/leave-requests
// @access  Private/Manager
router.get("/leave-requests", getDepartmentLeaveRequests);

// @desc    Approve leave request in manager's department
// @route   PUT /api/manager/leave-requests/:id/approve
// @access  Private/Manager
router.put("/leave-requests/:id/approve", approveDepartmentLeaveRequest);

// @desc    Reject leave request in manager's department
// @route   PUT /api/manager/leave-requests/:id/reject
// @access  Private/Manager
router.put("/leave-requests/:id/reject", rejectDepartmentLeaveRequest);

export default router;
