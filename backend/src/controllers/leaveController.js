// controllers/leaveController.js
import asyncHandler from "express-async-handler";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import LeaveBalance from "../models/LeaveBalance.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import AppError from "../utils/errorHandler.js";
import {
  getDayBoundaries,
  getWorkingDays,
  dateRangesOverlap,
  formatDate,
} from "../utils/dateUtils.js";

// @desc    Get all leave requests
// @route   GET /api/leaves
// @access  Private/Admin
export const getAllLeaveRequests = asyncHandler(async (req, res) => {
  const { status, start_date, end_date, department } = req.query;

  // Build filter criteria
  let filterCriteria = {};

  // Status filter
  if (status) {
    filterCriteria.status = status.toUpperCase();
  }

  // Date range filter
  if (start_date && end_date) {
    filterCriteria.$or = [
      {
        start_date: {
          $gte: new Date(start_date),
          $lte: new Date(end_date),
        },
      },
      {
        end_date: {
          $gte: new Date(start_date),
          $lte: new Date(end_date),
        },
      },
      {
        $and: [
          { start_date: { $lte: new Date(start_date) } },
          { end_date: { $gte: new Date(end_date) } },
        ],
      },
    ];
  } else if (start_date) {
    filterCriteria.start_date = { $gte: new Date(start_date) };
  } else if (end_date) {
    filterCriteria.end_date = { $lte: new Date(end_date) };
  }

  // If department filter is applied, first get all employees from that department
  if (department) {
    const departmentEmployees = await Employee.find({ dept_id: department });
    const employeeIds = departmentEmployees.map((emp) => emp._id);
    filterCriteria.emp_id = { $in: employeeIds };
  }

  const leaveRequests = await LeaveRequest.find(filterCriteria)
    .populate({
      path: "emp_id",
      populate: {
        path: "user_id",
        select: "-password_hash",
      },
    })
    .populate("leave_type_id")
    .populate("approved_by")
    .sort({ applied_date: -1 });

  res.json(leaveRequests);
});

// @desc    Get employee leave requests
// @route   GET /api/leaves/employee/:employeeId
// @access  Private/Admin/Manager/Self
export const getEmployeeLeaveRequests = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { status, year } = req.query;

  // Validate employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }

  // Build filter criteria
  let filterCriteria = { emp_id: employeeId };

  // Status filter
  if (status) {
    filterCriteria.status = status.toUpperCase();
  }

  // Year filter
  if (year) {
    const startOfYear = new Date(parseInt(year), 0, 1);
    const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
    filterCriteria.$or = [
      {
        start_date: {
          $gte: startOfYear,
          $lte: endOfYear,
        },
      },
      {
        end_date: {
          $gte: startOfYear,
          $lte: endOfYear,
        },
      },
    ];
  }

  const leaveRequests = await LeaveRequest.find(filterCriteria)
    .populate("leave_type_id")
    .populate("approved_by")
    .sort({ applied_date: -1 });

  res.json(leaveRequests);
});

// @desc    Get leave request by ID
// @route   GET /api/leaves/:id
// @access  Private
export const getLeaveRequestById = asyncHandler(async (req, res) => {
  const leaveRequest = await LeaveRequest.findById(req.params.id)
    .populate({
      path: "emp_id",
      populate: {
        path: "user_id",
        select: "-password_hash",
      },
    })
    .populate("leave_type_id")
    .populate("approved_by");

  if (!leaveRequest) {
    res.status(404);
    throw new AppError("Leave request not found", 404);
  }

  // Check if user is authorized to view this leave request
  if (
    req.userRoles &&
    !req.userRoles.includes("ADMIN") &&
    !req.userRoles.includes("MANAGER")
  ) {
    // If not admin or manager, check if it's the employee's own request
    if (
      !req.employee ||
      leaveRequest.emp_id.toString() !== req.employee._id.toString()
    ) {
      res.status(403);
      throw new AppError("Not authorized to view this leave request", 403);
    }
  }

  res.json(leaveRequest);
});

// @desc    Create leave request
// @route   POST /api/leaves
// @access  Private
export const createLeaveRequest = asyncHandler(async (req, res) => {
  const {
    emp_id,
    leave_type_id,
    start_date,
    end_date,
    duration,
    reason,
    is_half_day,
    contact_during_leave,
  } = req.body;

  // Validate employee exists
  const employee = await Employee.findById(emp_id);
  if (!employee) {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }

  // Validate leave type exists
  const leaveType = await LeaveType.findById(leave_type_id);
  if (!leaveType) {
    res.status(404);
    throw new AppError("Leave type not found", 404);
  }

  // Check leave balance
  const currentYear = new Date().getFullYear();
  const leaveBalance = await LeaveBalance.findOne({
    emp_id,
    leave_type_id,
    year: currentYear,
  });

  if (!leaveBalance) {
    // Create a leave balance record if it doesn't exist
    await LeaveBalance.create({
      emp_id,
      leave_type_id,
      year: currentYear,
      allocated_leaves: leaveType.default_annual_quota,
      used_leaves: 0,
      pending_leaves: 0,
      carried_forward: 0,
    });
  } else {
    // Check if there's enough balance
    const availableLeaves =
      leaveBalance.allocated_leaves +
      leaveBalance.carried_forward -
      leaveBalance.used_leaves -
      leaveBalance.pending_leaves;

    if (duration > availableLeaves) {
      res.status(400);
      throw new AppError(
        `Insufficient leave balance. Available: ${availableLeaves}, Requested: ${duration}`,
        400
      );
    }

    // Update pending leaves
    leaveBalance.pending_leaves += duration;
    await leaveBalance.save();
  }

  // Create leave request
  const leaveRequest = await LeaveRequest.create({
    emp_id,
    leave_type_id,
    start_date: new Date(start_date),
    end_date: new Date(end_date),
    duration,
    reason,
    status: "PENDING",
    applied_date: new Date(),
    is_half_day: is_half_day || false,
    contact_during_leave,
  });

  res.status(201).json(leaveRequest);
});

// @desc    Update leave request
// @route   PUT /api/leaves/:id
// @access  Private
export const updateLeaveRequest = asyncHandler(async (req, res) => {
  const {
    start_date,
    end_date,
    duration,
    reason,
    is_half_day,
    contact_during_leave,
  } = req.body;

  const leaveRequest = await LeaveRequest.findById(req.params.id);

  if (!leaveRequest) {
    res.status(404);
    throw new AppError("Leave request not found", 404);
  }

  // Can only update if status is pending
  if (leaveRequest.status !== "PENDING") {
    res.status(400);
    throw new AppError("Cannot modify already processed leave request", 400);
  }

  // Check if user is authorized to update this leave request
  if (
    req.userRoles &&
    !req.userRoles.includes("ADMIN") &&
    req.employee &&
    leaveRequest.emp_id.toString() !== req.employee._id.toString()
  ) {
    res.status(403);
    throw new AppError("Not authorized to update this leave request", 403);
  }

  // Update leave balance if duration changes
  if (duration && duration !== leaveRequest.duration) {
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      emp_id: leaveRequest.emp_id,
      leave_type_id: leaveRequest.leave_type_id,
      year: currentYear,
    });

    if (leaveBalance) {
      // Adjust pending leaves
      leaveBalance.pending_leaves =
        leaveBalance.pending_leaves - leaveRequest.duration + duration;
      await leaveBalance.save();
    }
  }

  // Update fields
  if (start_date) leaveRequest.start_date = new Date(start_date);
  if (end_date) leaveRequest.end_date = new Date(end_date);
  if (duration) leaveRequest.duration = duration;
  if (reason) leaveRequest.reason = reason;
  if (is_half_day !== undefined) leaveRequest.is_half_day = is_half_day;
  if (contact_during_leave)
    leaveRequest.contact_during_leave = contact_during_leave;

  leaveRequest.last_modified = new Date();

  const updatedLeaveRequest = await leaveRequest.save();

  res.json(updatedLeaveRequest);
});

// @desc    Cancel leave request
// @route   PUT /api/leaves/:id/cancel
// @access  Private
export const cancelLeaveRequest = asyncHandler(async (req, res) => {
  try {
    const requestedId = req.params.id;
    console.log(`Cancel leave request called for ID: ${requestedId}`);

    // Try to find the leave request by ID using different approaches
    let leaveRequest;
    let searchMethods = [];

    try {
      // First try: Direct MongoDB ObjectId lookup if it looks like an ObjectId
      if (requestedId.match(/^[0-9a-fA-F]{24}$/)) {
        searchMethods.push("ObjectId direct match");
        leaveRequest = await LeaveRequest.findById(requestedId);
      }

      // Second try: Find by any field that might contain an ID
      if (!leaveRequest) {
        searchMethods.push("Alternative fields search");
        leaveRequest = await LeaveRequest.findOne({
          $or: [
            { _id: requestedId },
            // Add any other fields you might use as identifiers
            { custom_id: requestedId },
          ],
        });
      }

      // Third try: Search by simple string comparison on _id field (works in some MongoDB configurations)
      if (!leaveRequest) {
        searchMethods.push("String _id comparison");
        const allLeaveRequests = await LeaveRequest.find({});
        leaveRequest = allLeaveRequests.find(
          (leave) =>
            leave._id.toString() === requestedId ||
            leave._id.toString().includes(requestedId)
        );
      }
    } catch (searchError) {
      console.error("Error during leave request search:", searchError.message);
      searchMethods.push(`Search error: ${searchError.message}`);
      // Continue without throwing - we'll check leaveRequest below
    }

    // If still not found, return 404
    if (!leaveRequest) {
      console.log(
        `Leave request not found after trying: ${searchMethods.join(", ")}`
      );
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    console.log(
      `Found leave request: ${leaveRequest._id}, status: ${leaveRequest.status}`
    );

    // Can only cancel if status is pending or approved
    if (!["PENDING", "APPROVED"].includes(leaveRequest.status)) {
      console.log(`Cannot cancel request with status: ${leaveRequest.status}`);
      return res.status(400).json({
        success: false,
        message: "Can only cancel pending or approved leave requests",
      });
    }

    // Store the raw IDs as strings to avoid ObjectId comparison issues
    const empId = leaveRequest.emp_id.toString();
    const leaveTypeId = leaveRequest.leave_type_id.toString();

    // Always allow the employee to cancel their own leave request
    let isAuthorized = false;

    // Check if user is admin
    if (req.userRoles && req.userRoles.includes("ADMIN")) {
      isAuthorized = true;
      console.log("User is admin, authorization granted");
    }

    // Check if employee is canceling their own request
    if (req.employee && req.employee._id) {
      const currentEmployeeId = req.employee._id.toString();
      if (currentEmployeeId === empId) {
        isAuthorized = true;
        console.log(
          "User is canceling their own leave request, authorization granted"
        );
      }
    }

    // Skip auth check in development mode if needed
    if (process.env.NODE_ENV === "development" && !isAuthorized) {
      isAuthorized = true;
      console.log("Development mode: Bypassing authorization check");
    }

    if (!isAuthorized) {
      console.log("Authorization failed");
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this leave request",
      });
    }

    // Update leave balance
    const currentYear = new Date().getFullYear();
    console.log(
      `Looking for leave balance - empId: ${empId}, leaveTypeId: ${leaveTypeId}, year: ${currentYear}`
    );

    // Find leave balance with error handling
    let leaveBalance;
    try {
      leaveBalance = await LeaveBalance.findOne({
        emp_id: leaveRequest.emp_id,
        leave_type_id: leaveRequest.leave_type_id,
        year: currentYear,
      });

      if (leaveBalance) {
        console.log(`Found leave balance: ${leaveBalance._id}`);
        console.log(
          `Current balance - pending: ${leaveBalance.pending_leaves}, used: ${leaveBalance.used_leaves}`
        );

        // Update leave balance based on request status
        if (leaveRequest.status === "PENDING") {
          // Reduce pending leaves
          leaveBalance.pending_leaves -= leaveRequest.duration;
          // Ensure we don't have negative values
          if (leaveBalance.pending_leaves < 0) leaveBalance.pending_leaves = 0;
        } else if (leaveRequest.status === "APPROVED") {
          // Reduce used leaves
          leaveBalance.used_leaves -= leaveRequest.duration;
          // Ensure we don't have negative values
          if (leaveBalance.used_leaves < 0) leaveBalance.used_leaves = 0;
        }

        console.log(
          `Updated balance - pending: ${leaveBalance.pending_leaves}, used: ${leaveBalance.used_leaves}`
        );
        await leaveBalance.save();
        console.log("Leave balance saved successfully");
      } else {
        console.log("No leave balance found for this leave request");
      }
    } catch (balanceError) {
      console.error("Error updating leave balance:", balanceError);
      // Continue with the cancellation even if balance update fails
    }

    // Update leave request
    console.log("Updating leave request status to CANCELLED");
    leaveRequest.status = "CANCELLED";
    leaveRequest.last_modified = new Date();

    const updatedLeaveRequest = await leaveRequest.save();
    console.log("Leave request updated successfully");

    // If leave was already approved, update any attendance records
    if (leaveRequest.status === "APPROVED") {
      console.log("Updating attendance records for approved leave");
      try {
        const result = await Attendance.updateMany(
          {
            emp_id: leaveRequest.emp_id,
            attendance_date: {
              $gte: leaveRequest.start_date,
              $lte: leaveRequest.end_date,
            },
            leave_request_id: leaveRequest._id,
          },
          {
            $set: {
              status: "ABSENT",
              is_leave: false,
              leave_request_id: null,
            },
          }
        );
        console.log(
          `Attendance records updated: ${result.modifiedCount} records modified`
        );
      } catch (attendanceError) {
        console.error("Error updating attendance records:", attendanceError);
        // Continue despite attendance update errors
      }
    }

    // Send a clear success response
    console.log("Sending success response");
    return res.status(200).json({
      success: true,
      message: "Leave request cancelled successfully",
      data: updatedLeaveRequest,
    });
  } catch (error) {
    console.error("Error cancelling leave request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel leave request",
      error: error.message,
    });
  }
});

// @desc    Update leave request status (approve/reject)
// @route   PUT /api/leaves/:id/status
// @access  Private/Manager
export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, rejection_reason } = req.body;

  console.log(`Processing leave status update: ${req.params.id} to ${status}`);

  const leaveRequest = await LeaveRequest.findById(req.params.id)
    .populate("leave_type_id")
    .populate("emp_id");

  if (!leaveRequest) {
    res.status(404);
    throw new AppError("Leave request not found", 404);
  }

  // Can only update if status is pending
  if (leaveRequest.status !== "PENDING") {
    res.status(400);
    throw new AppError("Cannot modify already processed leave request", 400);
  }

  // Update leave balance - CRITICAL SECTION
  const currentYear = new Date().getFullYear();
  const leaveBalance = await LeaveBalance.findOne({
    emp_id: leaveRequest.emp_id._id,
    leave_type_id: leaveRequest.leave_type_id._id,
    year: currentYear,
  });

  if (leaveBalance) {
    console.log(
      `Found leave balance for ${leaveRequest.leave_type_id.leave_name}:`,
      {
        allocated: leaveBalance.allocated_leaves,
        used: leaveBalance.used_leaves,
        pending: leaveBalance.pending_leaves,
        carried_forward: leaveBalance.carried_forward,
        duration: leaveRequest.duration,
      }
    );

    // Reduce pending leaves
    leaveBalance.pending_leaves -= leaveRequest.duration;

    // Ensure no negative values
    if (leaveBalance.pending_leaves < 0) leaveBalance.pending_leaves = 0;

    if (status === "APPROVED") {
      // Add to used leaves
      leaveBalance.used_leaves += leaveRequest.duration;
      console.log(
        `Approved leave: Decreasing pending by ${leaveRequest.duration}, increasing used by ${leaveRequest.duration}`
      );
    } else {
      console.log(
        `Rejected leave: Decreasing pending by ${leaveRequest.duration} only`
      );
    }

    // CRITICAL: Save the balance changes
    await leaveBalance.save();

    console.log(`Updated leave balance:`, {
      allocated: leaveBalance.allocated_leaves,
      used: leaveBalance.used_leaves,
      pending: leaveBalance.pending_leaves,
      carried_forward: leaveBalance.carried_forward,
    });
  } else {
    console.warn(
      `No leave balance found for employee ${leaveRequest.emp_id._id} and leave type ${leaveRequest.leave_type_id._id}`
    );
  }

  // Update leave request
  leaveRequest.status = status;
  if (status === "REJECTED" && rejection_reason) {
    leaveRequest.rejection_reason = rejection_reason;
  }
  leaveRequest.approved_by = req.employee ? req.employee._id : null;
  leaveRequest.last_modified = new Date();

  const updatedLeaveRequest = await leaveRequest.save();

  console.log(`Leave request ${leaveRequest._id} updated to ${status}`);

  // If approved, create attendance records for the leave period
  if (status === "APPROVED") {
    const startDate = new Date(leaveRequest.start_date);
    const endDate = new Date(leaveRequest.end_date);

    // Loop through each day of the leave period
    for (
      let currentDate = new Date(startDate);
      currentDate <= endDate;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      const dayBoundary = getDayBoundaries(currentDate);

      // Check if an attendance record already exists for this day
      const existingAttendance = await Attendance.findOne({
        emp_id: leaveRequest.emp_id._id,
        attendance_date: {
          $gte: dayBoundary.startOfDay,
          $lte: dayBoundary.endOfDay,
        },
      });

      if (existingAttendance) {
        // Update existing record
        existingAttendance.status = "LEAVE";
        existingAttendance.is_leave = true;
        existingAttendance.leave_request_id = leaveRequest._id;
        await existingAttendance.save();
      } else {
        // Create new attendance record
        await Attendance.create({
          emp_id: leaveRequest.emp_id._id,
          attendance_date: new Date(currentDate),
          status: "LEAVE",
          is_leave: true,
          leave_request_id: leaveRequest._id,
        });
      }
    }

    console.log(`Created/updated attendance records for leave period`);
  }

  res.json(updatedLeaveRequest);
});

// @desc    Get leave balances for an employee
// @route   GET /api/leaves/balance/:employeeId
// @access  Private/Admin/Manager/Self
export const getLeaveBalances = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { year } = req.query;

  // Validate employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }

  // Default to current year if not specified
  const balanceYear = year ? parseInt(year) : new Date().getFullYear();

  // Get leave balances
  const leaveBalances = await LeaveBalance.find({
    emp_id: employeeId,
    year: balanceYear,
  }).populate("leave_type_id");

  // Also get all leave types to include those with no balance
  const allLeaveTypes = await LeaveType.find({});

  // Create a complete response including leave types with no balance
  const completeBalances = allLeaveTypes.map((leaveType) => {
    const existingBalance = leaveBalances.find(
      (balance) =>
        balance.leave_type_id._id.toString() === leaveType._id.toString()
    );

    if (existingBalance) {
      return existingBalance;
    } else {
      // Create a virtual balance record (not saved to DB)
      return {
        emp_id: employeeId,
        leave_type_id: leaveType,
        year: balanceYear,
        allocated_leaves: leaveType.default_annual_quota,
        used_leaves: 0,
        pending_leaves: 0,
        carried_forward: 0,
        _id: null,
        isVirtual: true,
      };
    }
  });

  res.json(completeBalances);
});

// @desc    Update leave balance
// @route   PUT /api/leaves/balance/:employeeId
// @access  Private/Admin
export const updateLeaveBalance = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { leave_type_id, year, allocated_leaves, carried_forward } = req.body;

  // Validate employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }

  // Validate leave type exists
  const leaveType = await LeaveType.findById(leave_type_id);
  if (!leaveType) {
    res.status(404);
    throw new AppError("Leave type not found", 404);
  }

  // Find existing balance or create new one
  let leaveBalance = await LeaveBalance.findOne({
    emp_id: employeeId,
    leave_type_id,
    year,
  });

  if (leaveBalance) {
    // Update existing record
    leaveBalance.allocated_leaves =
      allocated_leaves !== undefined
        ? allocated_leaves
        : leaveBalance.allocated_leaves;
    leaveBalance.carried_forward =
      carried_forward !== undefined
        ? carried_forward
        : leaveBalance.carried_forward;
    await leaveBalance.save();
  } else {
    // Create new record
    leaveBalance = await LeaveBalance.create({
      emp_id: employeeId,
      leave_type_id,
      year,
      allocated_leaves: allocated_leaves || leaveType.default_annual_quota,
      used_leaves: 0,
      pending_leaves: 0,
      carried_forward: carried_forward || 0,
    });
  }

  res.json(leaveBalance);
});

// @desc    Get all leave types
// @route   GET /api/leaves/types
// @access  Private
export const getAllLeaveTypes = asyncHandler(async (req, res) => {
  const leaveTypes = await LeaveType.find({});
  res.json(leaveTypes);
});

// @desc    Get single leave type
// @route   GET /api/leaves/types/:id
// @access  Private
export const getLeaveTypeById = asyncHandler(async (req, res) => {
  const leaveType = await LeaveType.findById(req.params.id);

  if (!leaveType) {
    res.status(404);
    throw new AppError("Leave type not found", 404);
  }

  res.json(leaveType);
});

// @desc    Create new leave type
// @route   POST /api/leaves/types
// @access  Private/Admin
export const createLeaveType = asyncHandler(async (req, res) => {
  const {
    leave_code,
    leave_name,
    description,
    is_carry_forward,
    default_annual_quota,
    requires_approval,
    max_consecutive_days,
  } = req.body;

  // Check if leave type with the same code already exists
  const existingLeaveType = await LeaveType.findOne({ leave_code });

  if (existingLeaveType) {
    res.status(400);
    throw new AppError("A leave type with this code already exists", 400);
  }

  const leaveType = await LeaveType.create({
    leave_code,
    leave_name,
    description,
    is_carry_forward: is_carry_forward || false,
    default_annual_quota,
    requires_approval: requires_approval || true,
    max_consecutive_days: max_consecutive_days || 0,
  });

  res.status(201).json(leaveType);
});

// @desc    Update leave type
// @route   PUT /api/leaves/types/:id
// @access  Private/Admin
export const updateLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await LeaveType.findById(req.params.id);

  if (!leaveType) {
    res.status(404);
    throw new AppError("Leave type not found", 404);
  }

  const {
    leave_code,
    leave_name,
    description,
    is_carry_forward,
    default_annual_quota,
    requires_approval,
    max_consecutive_days,
  } = req.body;

  // If leave code is being changed, check if the new code already exists
  if (leave_code !== leaveType.leave_code) {
    const existingLeaveType = await LeaveType.findOne({ leave_code });
    if (existingLeaveType) {
      res.status(400);
      throw new AppError("A leave type with this code already exists", 400);
    }
  }

  leaveType.leave_code = leave_code || leaveType.leave_code;
  leaveType.leave_name = leave_name || leaveType.leave_name;
  leaveType.description = description || leaveType.description;
  leaveType.is_carry_forward =
    is_carry_forward !== undefined
      ? is_carry_forward
      : leaveType.is_carry_forward;
  leaveType.default_annual_quota =
    default_annual_quota || leaveType.default_annual_quota;
  leaveType.requires_approval =
    requires_approval !== undefined
      ? requires_approval
      : leaveType.requires_approval;
  leaveType.max_consecutive_days =
    max_consecutive_days !== undefined
      ? max_consecutive_days
      : leaveType.max_consecutive_days;

  const updatedLeaveType = await leaveType.save();

  res.json(updatedLeaveType);
});
