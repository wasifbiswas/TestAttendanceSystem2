import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignRole,
  removeRole,
  getSystemStats,
  getUserRoleCounts,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { updateUserSchema } from "../validations/userValidation.js";
import {
  getAllLeaveRequests,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(admin);

// System statistics
router.get("/stats", getSystemStats);

// User management
router.route("/users").get(getAllUsers);
router.get("/users/role-counts", getUserRoleCounts);

router
  .route("/users/:id")
  .get(getUserById)
  .put(validate(updateUserSchema), updateUser)
  .delete(deleteUser);

// Role management
router.post("/users/:id/roles", assignRole);
router.delete("/users/:userId/roles/:roleId", removeRole);

// Leave request management
router.get("/leave-requests/pending", async (req, res) => {
  try {
    req.query.status = "PENDING";
    // Store the original response handling
    const originalRes = res;

    // Create a custom response object to intercept the response
    const customRes = {
      ...res,
      json: (data) => {
        // If the data is not in the expected format, transform it
        if (Array.isArray(data)) {
          // Map the data to match the expected format in the frontend
          const formattedData = data.map((leave) => ({
            id: leave._id.toString(),
            userId: leave.emp_id.user_id._id.toString(),
            userName: leave.emp_id.user_id.full_name,
            employee_id: leave.emp_id._id.toString(),
            employee_code:
              leave.emp_id.employee_code ||
              "EMP-" + leave.emp_id._id.toString().substring(0, 5),
            type: leave.leave_type_id.leave_name,
            start_date: leave.start_date,
            end_date: leave.end_date,
            reason: leave.reason,
            status: leave.status,
            createdAt: leave.applied_date,
            updatedAt: leave.last_modified,
          }));

          // Send the formatted data
          return originalRes.json(formattedData);
        }

        // If it's not an array, just pass it through
        return originalRes.json(data);
      },
    };

    // Call the controller with our custom response
    return await getAllLeaveRequests(req, customRes);
  } catch (error) {
    console.error("Error fetching pending leave requests:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch pending leave requests" });
  }
});

router.post("/leave-requests/:id/approve", async (req, res) => {
  try {
    console.log(`Admin attempting to approve leave request: ${req.params.id}`);

    req.body.status = "APPROVED";
    const leaveId = req.params.id;

    // Get models
    const LeaveRequest = (await import("../models/LeaveRequest.js")).default;
    const LeaveBalance = (await import("../models/LeaveBalance.js")).default;

    // Get leave request details for logging
    const leaveRequest = await LeaveRequest.findById(leaveId)
      .populate("leave_type_id")
      .populate("emp_id");

    if (!leaveRequest) {
      console.error(`Leave request not found: ${leaveId}`);
      return res.status(404).json({ message: "Leave request not found" });
    }

    console.log(`Processing leave approval for leave ID: ${leaveId}`);
    console.log(
      `Leave details: Type=${leaveRequest.leave_type_id.leave_code}, Duration=${leaveRequest.duration} days`
    );

    // Call the controller function to update status which will handle balance updates
    await updateLeaveStatus(req, res);

    // Double-check if leave balances were updated correctly after the update
    const currentYear = new Date().getFullYear();
    const updatedBalance = await LeaveBalance.findOne({
      emp_id: leaveRequest.emp_id._id,
      leave_type_id: leaveRequest.leave_type_id._id,
      year: currentYear,
    }).populate("leave_type_id");

    if (updatedBalance) {
      console.log(
        `After approval, final leave balance for ${updatedBalance.leave_type_id.leave_name}:`,
        {
          allocated: updatedBalance.allocated_leaves,
          used: updatedBalance.used_leaves,
          pending: updatedBalance.pending_leaves,
          carried_forward: updatedBalance.carried_forward,
          available:
            updatedBalance.allocated_leaves +
            updatedBalance.carried_forward -
            updatedBalance.used_leaves -
            updatedBalance.pending_leaves,
        }
      );
    } else {
      console.warn(
        `Couldn't find leave balance after approval for verification.`
      );
    }

    // Response has already been sent by updateLeaveStatus
  } catch (error) {
    console.error("Error approving leave request:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Failed to approve leave request" });
  }
});

router.post("/leave-requests/:id/deny", async (req, res) => {
  try {
    req.body.status = "REJECTED";
    req.params.id = req.params.id;

    const result = await updateLeaveStatus(req, res);
    return result;
  } catch (error) {
    console.error("Error denying leave request:", error);
    return res.status(500).json({ message: "Failed to deny leave request" });
  }
});

// Department statistics
router.get("/departments/stats", async (req, res) => {
  try {
    const Department = (await import("../models/Department.js")).default;
    const Employee = (await import("../models/Employee.js")).default;

    // Get all departments
    const departments = await Department.find({});

    // Calculate employee counts for each department
    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({
          dept_id: dept._id,
        });

        return {
          department: dept.dept_name,
          employeeCount: employeeCount,
          departmentId: dept._id.toString(),
        };
      })
    );

    res.json(departmentStats);
  } catch (error) {
    console.error("Error fetching department statistics:", error);
    res.status(500).json({ message: "Failed to fetch department statistics" });
  }
});

export default router;
