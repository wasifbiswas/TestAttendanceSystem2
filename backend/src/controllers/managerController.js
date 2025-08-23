import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Attendance from "../models/Attendance.js";

// @desc    Get department statistics for manager's department
// @route   GET /api/manager/department-stats
// @access  Private/Manager
export const getDepartmentStats = asyncHandler(async (req, res) => {
  try {
    // Get the manager's employee record to find their department
    const managerEmployee = await Employee.findOne({
      user_id: req.user._id,
    }).populate("dept_id");

    if (!managerEmployee) {
      return res.status(404).json({
        success: false,
        message: "Manager employee record not found",
      });
    }

    const departmentId = managerEmployee.dept_id._id;

    // Get total employees in department
    const totalEmployees = await Employee.countDocuments({
      dept_id: departmentId,
      status: "ACTIVE",
    });

    // Get pending leave requests for department employees (not managers)
    const departmentEmployees = await Employee.find({
      dept_id: departmentId,
      _id: { $ne: managerEmployee._id }, // Exclude the manager themselves
    }).select("_id");

    const employeeIds = departmentEmployees.map((emp) => emp._id);

    const pendingLeaveRequests = await LeaveRequest.countDocuments({
      emp_id: { $in: employeeIds }, // Use emp_id (correct field name)
      approver_type: "MANAGER",
      status: "PENDING",
    });

    // Get today's attendance count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.countDocuments({
      employee_id: { $in: employeeIds },
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    res.json({
      success: true,
      data: {
        department: managerEmployee.dept_id.dept_name,
        totalEmployees,
        pendingLeaveRequests,
        todayAttendance,
        attendancePercentage:
          totalEmployees > 0
            ? Math.round((todayAttendance / totalEmployees) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching department stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department statistics",
      error: error.message,
    });
  }
});

// @desc    Get employees in manager's department
// @route   GET /api/manager/department-employees
// @access  Private/Manager
export const getDepartmentEmployees = asyncHandler(async (req, res) => {
  try {
    // Get the manager's employee record to find their department
    const managerEmployee = await Employee.findOne({
      user_id: req.user._id,
    }).populate("dept_id");

    if (!managerEmployee) {
      return res.status(404).json({
        success: false,
        message: "Manager employee record not found",
      });
    }

    const departmentId = managerEmployee.dept_id._id;

    // Get all employees in the department (excluding the manager)
    const employees = await Employee.find({
      dept_id: departmentId,
      _id: { $ne: managerEmployee._id }, // Exclude the manager themselves
    })
      .populate("user_id", "full_name email")
      .populate("dept_id", "dept_name")
      .sort({ user_id: 1 });

    res.json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error("Error fetching department employees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department employees",
      error: error.message,
    });
  }
});

// @desc    Get leave requests for manager's department (only employee requests)
// @route   GET /api/manager/department-leave-requests
// @access  Private/Manager
export const getDepartmentLeaveRequests = asyncHandler(async (req, res) => {
  try {
    // Get the manager's employee record to find their department
    const managerEmployee = await Employee.findOne({
      user_id: req.user._id,
    }).populate("dept_id");

    if (!managerEmployee) {
      return res.status(404).json({
        success: false,
        message: "Manager employee record not found",
      });
    }

    const departmentId = managerEmployee.dept_id._id;
    const { status = "PENDING", page = 1, limit = 10 } = req.query;

    // Get employees in manager's department (excluding the manager)
    const departmentEmployees = await Employee.find({
      dept_id: departmentId,
      _id: { $ne: managerEmployee._id },
    }).select("_id");

    const employeeIds = departmentEmployees.map((emp) => emp._id);

    // Build query for leave requests
    let query = {
      emp_id: { $in: employeeIds }, // Use emp_id (correct field name)
      approver_type: "MANAGER", // Only employee requests that need manager approval
    };

    if (status && status !== "ALL") {
      query.status = status.toUpperCase();
    }

    const skip = (page - 1) * limit;

    // Get leave requests with employee and leave type details
    const leaveRequests = await LeaveRequest.find(query)
      .populate({
        path: "emp_id", // Use emp_id (correct field name)
        populate: {
          path: "user_id",
          select: "full_name email",
        },
      })
      .populate("leave_type_id", "name description leave_name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LeaveRequest.countDocuments(query);

    // Filter out any leave requests with null emp_id to prevent errors
    const validLeaveRequests = leaveRequests.filter(
      (leave) => leave.emp_id && leave.emp_id.user_id
    );

    res.json({
      success: true,
      count: validLeaveRequests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      leaveRequests: validLeaveRequests,
    });
  } catch (error) {
    console.error("Error fetching department leave requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department leave requests",
      error: error.message,
    });
  }
});

// @desc    Approve leave request for department employee
// @route   PUT /api/manager/approve-leave/:id
// @access  Private/Manager
export const approveDepartmentLeaveRequest = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // Get the manager's employee record to find their department
    const managerEmployee = await Employee.findOne({
      user_id: req.user._id,
    }).populate("dept_id");

    if (!managerEmployee) {
      return res.status(404).json({
        success: false,
        message: "Manager employee record not found",
      });
    }

    // Find the leave request
    const leaveRequest = await LeaveRequest.findById(id).populate({
      path: "emp_id", // Use emp_id (correct field name)
      populate: {
        path: "dept_id",
        select: "dept_name",
      },
    });

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (!leaveRequest.emp_id) {
      return res.status(400).json({
        success: false,
        message: "Leave request has no employee associated",
      });
    }

    // Verify this is an employee request for manager approval
    if (leaveRequest.approver_type !== "MANAGER") {
      return res.status(403).json({
        success: false,
        message: "This leave request is not for manager approval",
      });
    }

    // Verify the employee belongs to manager's department
    if (
      leaveRequest.emp_id.dept_id._id.toString() !==
      managerEmployee.dept_id._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only approve leave requests for your department employees",
      });
    }

    // Verify the request is still pending
    if (leaveRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "This leave request has already been processed",
      });
    }

    // Update the leave request
    leaveRequest.status = "APPROVED";
    leaveRequest.approved_by = req.user._id;
    leaveRequest.approved_date = new Date();
    if (remarks) {
      leaveRequest.remarks = remarks;
    }

    await leaveRequest.save();

    res.json({
      success: true,
      message: "Leave request approved successfully",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error approving leave request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve leave request",
      error: error.message,
    });
  }
});

// @desc    Reject leave request for department employee
// @route   PUT /api/manager/reject-leave/:id
// @access  Private/Manager
export const rejectDepartmentLeaveRequest = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // Get the manager's employee record to find their department
    const managerEmployee = await Employee.findOne({
      user_id: req.user._id,
    }).populate("dept_id");

    if (!managerEmployee) {
      return res.status(404).json({
        success: false,
        message: "Manager employee record not found",
      });
    }

    // Find the leave request
    const leaveRequest = await LeaveRequest.findById(id).populate({
      path: "emp_id", // Use emp_id (correct field name)
      populate: {
        path: "dept_id",
        select: "dept_name",
      },
    });

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (!leaveRequest.emp_id) {
      return res.status(400).json({
        success: false,
        message: "Leave request has no employee associated",
      });
    }

    // Verify this is an employee request for manager approval
    if (leaveRequest.approver_type !== "MANAGER") {
      return res.status(403).json({
        success: false,
        message: "This leave request is not for manager approval",
      });
    }

    // Verify the employee belongs to manager's department
    if (
      leaveRequest.emp_id.dept_id._id.toString() !==
      managerEmployee.dept_id._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only reject leave requests for your department employees",
      });
    }

    // Verify the request is still pending
    if (leaveRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "This leave request has already been processed",
      });
    }

    // Update the leave request
    leaveRequest.status = "REJECTED";
    leaveRequest.approved_by = req.user._id;
    leaveRequest.approved_date = new Date();
    if (remarks) {
      leaveRequest.remarks = remarks;
    }

    await leaveRequest.save();

    res.json({
      success: true,
      message: "Leave request rejected successfully",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject leave request",
      error: error.message,
    });
  }
});
