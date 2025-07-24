// routes/leaveRoutes.js
import express from "express";
import {
  getAllLeaveRequests,
  getEmployeeLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  updateLeaveRequest,
  cancelLeaveRequest,
  updateLeaveStatus,
  getLeaveBalances,
  updateLeaveBalance,
  getAllLeaveTypes,
  getLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "../controllers/leaveController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin, manager, selfOrManager } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  leaveApprovalSchema,
  createLeaveBalanceSchema,
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
} from "../validations/leaveValidation.js";

const router = express.Router();

// Leave Types routes
router
  .route("/types")
  .get(protect, getAllLeaveTypes)
  .post(protect, admin, validate(createLeaveTypeSchema), createLeaveType);

router
  .route("/types/:id")
  .get(protect, getLeaveTypeById)
  .put(protect, admin, validate(updateLeaveTypeSchema), updateLeaveType)
  .delete(protect, admin, deleteLeaveType);

// Get all leave requests (admin only)
router.get("/", protect, admin, getAllLeaveRequests);

// Create new leave request
router.post(
  "/",
  protect,
  validate(createLeaveRequestSchema),
  createLeaveRequest
);

// Get employee leave requests
router.get(
  "/employee/:employeeId",
  protect,
  selfOrManager,
  getEmployeeLeaveRequests
);

// Get and update leave balances
router
  .route("/balance/:employeeId")
  .get(protect, selfOrManager, getLeaveBalances)
  .put(protect, admin, validate(createLeaveBalanceSchema), updateLeaveBalance);

// Manage individual leave requests
router
  .route("/:id")
  .get(protect, getLeaveRequestById)
  .put(protect, validate(updateLeaveRequestSchema), updateLeaveRequest);

// Cancel leave request
router.put("/:id/cancel", protect, cancelLeaveRequest);

// Update leave request status (approve/reject)
router.put(
  "/:id/status",
  protect,
  manager,
  validate(leaveApprovalSchema),
  updateLeaveStatus
);

export default router;
