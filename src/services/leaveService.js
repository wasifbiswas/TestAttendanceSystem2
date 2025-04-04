import mongoose from "mongoose";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import LeaveBalance from "../models/LeaveBalance.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import AppError from "../utils/errorHandler.js";
import { getDayBoundaries } from "../utils/dateUtils.js";

/**
 * Get all leave requests with optional filtering
 */
export const getAllLeaveRequests = async (filterOptions = {}) => {
  const { startDate, endDate, status, employeeId, departmentId } =
    filterOptions;

  // Build filter criteria
  let filterCriteria = {};

  // Date filters
  if (startDate && endDate) {
    filterCriteria.start_date = { $gte: new Date(startDate) };
    filterCriteria.end_date = { $lte: new Date(endDate) };
  } else if (startDate) {
    filterCriteria.start_date = { $gte: new Date(startDate) };
  } else if (endDate) {
    filterCriteria.end_date = { $lte: new Date(endDate) };
  }

  // Status filter
  if (status) {
    filterCriteria.status = status;
  }

  // Employee filter
  if (employeeId) {
    filterCriteria.emp_id = employeeId;
  }

  // Department filter - need to get all employees in the department first
  if (departmentId) {
    const departmentEmployees = await Employee.find({ dept_id: departmentId });
    const employeeIds = departmentEmployees.map((emp) => emp._id);
    filterCriteria.emp_id = { $in: employeeIds };
  }

  return await LeaveRequest.find(filterCriteria)
    .populate({
      path: "emp_id",
      populate: [
        {
          path: "user_id",
          select: "-password_hash",
        },
        {
          path: "dept_id",
        },
      ],
    })
    .populate("leave_type_id")
    .populate("approved_by")
    .sort({ applied_date: -1 });
};

/**
 * Get leave requests for a specific employee
 */
export const getEmployeeLeaveRequests = async (
  employeeId,
  filterOptions = {}
) => {
  const { status, year } = filterOptions;

  // Validate employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Build filter criteria
  let filterCriteria = { emp_id: employeeId };

  // Status filter
  if (status) {
    filterCriteria.status = status;
  }

  // Year filter
  if (year) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    filterCriteria.start_date = { $gte: startOfYear, $lte: endOfYear };
  }

  return await LeaveRequest.find(filterCriteria)
    .populate("leave_type_id")
    .populate("approved_by")
    .sort({ applied_date: -1 });
};

/**
 * Get a leave request by ID
 */
export const getLeaveRequestById = async (leaveRequestId) => {
  const leaveRequest = await LeaveRequest.findById(leaveRequestId)
    .populate({
      path: "emp_id",
      populate: [
        {
          path: "user_id",
          select: "-password_hash",
        },
        {
          path: "dept_id",
        },
      ],
    })
    .populate("leave_type_id")
    .populate("approved_by");

  if (!leaveRequest) {
    throw new AppError("Leave request not found", 404);
  }

  return leaveRequest;
};

/**
 * Create a new leave request
 */
export const createLeaveRequest = async (leaveData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { emp_id, leave_type_id, start_date, end_date, duration } = leaveData;

    // Check if employee exists
    const employee = await Employee.findById(emp_id).session(session);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    // Check if leave type exists
    const leaveType = await LeaveType.findById(leave_type_id).session(session);
    if (!leaveType) {
      throw new AppError("Leave type not found", 404);
    }

    // Check for overlapping leave requests
    const overlappingLeave = await LeaveRequest.findOne({
      emp_id,
      status: { $in: ["PENDING", "APPROVED"] },
      $or: [
        {
          start_date: { $lte: new Date(start_date) },
          end_date: { $gte: new Date(start_date) },
        },
        {
          start_date: { $lte: new Date(end_date) },
          end_date: { $gte: new Date(end_date) },
        },
        {
          start_date: { $gte: new Date(start_date) },
          end_date: { $lte: new Date(end_date) },
        },
      ],
    }).session(session);

    if (overlappingLeave) {
      throw new AppError(
        "You already have an overlapping leave request for this period",
        400
      );
    }

    // Check leave balance
    if (leaveType.requires_approval) {
      const currentYear = new Date().getFullYear();
      let leaveBalance = await LeaveBalance.findOne({
        emp_id,
        leave_type_id,
        year: currentYear,
      }).session(session);

      // Create leave balance if it doesn't exist
      if (!leaveBalance) {
        leaveBalance = await LeaveBalance.create(
          [
            {
              emp_id,
              leave_type_id,
              year: currentYear,
              allocated_leaves: leaveType.default_annual_quota,
              carried_forward: 0,
              used_leaves: 0,
            },
          ],
          { session }
        );
        leaveBalance = leaveBalance[0];
      }

      const availableLeaves =
        leaveBalance.allocated_leaves +
        leaveBalance.carried_forward -
        leaveBalance.used_leaves;

      if (duration > availableLeaves) {
        throw new AppError(
          `Insufficient leave balance. Available: ${availableLeaves} days`,
          400
        );
      }
    }

    // Create leave request
    const leaveRequest = await LeaveRequest.create([leaveData], { session });

    await session.commitTransaction();
    return leaveRequest[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Update a leave request
 */
export const updateLeaveRequest = async (leaveRequestId, updateData) => {
  const leaveRequest = await LeaveRequest.findById(leaveRequestId);

  if (!leaveRequest) {
    throw new AppError("Leave request not found", 404);
  }

  // Only allow updates if status is PENDING
  if (leaveRequest.status !== "PENDING") {
    throw new AppError("Cannot update a processed leave request", 400);
  }

  // Update fields
  Object.keys(updateData).forEach((key) => {
    leaveRequest[key] = updateData[key];
  });

  return await leaveRequest.save();
};

/**
 * Cancel a leave request
 */
export const cancelLeaveRequest = async (leaveRequestId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const leaveRequest = await LeaveRequest.findById(leaveRequestId).session(
      session
    );

    if (!leaveRequest) {
      throw new AppError("Leave request not found", 404);
    }

    // Only PENDING and APPROVED leaves can be cancelled
    if (!["PENDING", "APPROVED"].includes(leaveRequest.status)) {
      throw new AppError(
        "Only pending or approved leaves can be cancelled",
        400
      );
    }

    // Update leave request status
    leaveRequest.status = "CANCELLED";
    leaveRequest.last_modified = new Date();
    await leaveRequest.save({ session });

    // If leave was approved, update leave balance by returning days
    if (leaveRequest.status === "APPROVED") {
      const currentYear = new Date().getFullYear();
      const leaveBalance = await LeaveBalance.findOne({
        emp_id: leaveRequest.emp_id,
        leave_type_id: leaveRequest.leave_type_id,
        year: currentYear,
      }).session(session);

      if (leaveBalance) {
        leaveBalance.used_leaves -= leaveRequest.duration;
        await leaveBalance.save({ session });
      }

      // Update attendance records
      await Attendance.updateMany(
        {
          emp_id: leaveRequest.emp_id,
          attendance_date: {
            $gte: leaveRequest.start_date,
            $lte: leaveRequest.end_date,
          },
          is_leave: true,
          leave_request_id: leaveRequest._id,
        },
        {
          $set: {
            status: "ABSENT",
            is_leave: false,
            leave_request_id: null,
          },
        },
        { session }
      );
    }

    await session.commitTransaction();
    return leaveRequest;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Update leave request status (approve/reject)
 */
export const updateLeaveStatus = async (
  leaveRequestId,
  status,
  approverId,
  rejectionReason = null
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const leaveRequest = await LeaveRequest.findById(leaveRequestId).session(
      session
    );

    if (!leaveRequest) {
      throw new AppError("Leave request not found", 404);
    }

    // Only PENDING leaves can be approved/rejected
    if (leaveRequest.status !== "PENDING") {
      throw new AppError("Only pending leave requests can be processed", 400);
    }

    // Update leave request status
    leaveRequest.status = status;
    leaveRequest.approved_by = approverId;
    leaveRequest.last_modified = new Date();

    if (status === "REJECTED" && rejectionReason) {
      leaveRequest.rejection_reason = rejectionReason;
    }

    await leaveRequest.save({ session });

    // If approving, update leave balance and attendance
    if (status === "APPROVED") {
      // Update leave balance
      const currentYear = new Date().getFullYear();
      const leaveBalance = await LeaveBalance.findOne({
        emp_id: leaveRequest.emp_id,
        leave_type_id: leaveRequest.leave_type_id,
        year: currentYear,
      }).session(session);

      if (leaveBalance) {
        leaveBalance.used_leaves += leaveRequest.duration;
        await leaveBalance.save({ session });
      }

      // Create or update attendance records for leave days
      const startDate = new Date(leaveRequest.start_date);
      const endDate = new Date(leaveRequest.end_date);

      for (
        let date = startDate;
        date <= endDate;
        date.setDate(date.getDate() + 1)
      ) {
        const currentDate = new Date(date);
        const { startOfDay, endOfDay } = getDayBoundaries(currentDate);

        // Check if attendance record exists
        let attendanceRecord = await Attendance.findOne({
          emp_id: leaveRequest.emp_id,
          attendance_date: { $gte: startOfDay, $lt: endOfDay },
        }).session(session);

        if (attendanceRecord) {
          // Update existing record
          attendanceRecord.status = "LEAVE";
          attendanceRecord.is_leave = true;
          attendanceRecord.leave_request_id = leaveRequest._id;
          await attendanceRecord.save({ session });
        } else {
          // Create new attendance record
          await Attendance.create(
            [
              {
                emp_id: leaveRequest.emp_id,
                attendance_date: currentDate,
                status: "LEAVE",
                is_leave: true,
                leave_request_id: leaveRequest._id,
              },
            ],
            { session }
          );
        }
      }
    }

    await session.commitTransaction();
    return leaveRequest;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get leave balances for an employee
 */
export const getLeaveBalances = async (
  employeeId,
  year = new Date().getFullYear()
) => {
  // Validate employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Get all leave types
  const leaveTypes = await LeaveType.find({});

  // Get leave balances
  const leaveBalances = await LeaveBalance.find({
    emp_id: employeeId,
    year,
  }).populate("leave_type_id");

  // If some leave types don't have a balance record, create default entries
  const balanceMap = {};
  leaveBalances.forEach((balance) => {
    balanceMap[balance.leave_type_id._id.toString()] = balance;
  });

  const result = [];

  for (const leaveType of leaveTypes) {
    const leaveTypeId = leaveType._id.toString();

    if (balanceMap[leaveTypeId]) {
      // Add existing balance record
      const balance = balanceMap[leaveTypeId];
      result.push({
        _id: balance._id,
        leave_type: leaveType,
        allocated: balance.allocated_leaves,
        carried_forward: balance.carried_forward,
        used: balance.used_leaves,
        available:
          balance.allocated_leaves +
          balance.carried_forward -
          balance.used_leaves,
        year,
      });
    } else {
      // Create default record with zero balance
      result.push({
        leave_type: leaveType,
        allocated: leaveType.default_annual_quota,
        carried_forward: 0,
        used: 0,
        available: leaveType.default_annual_quota,
        year,
      });
    }
  }

  return result;
};

/**
 * Update leave balance for an employee
 */
export const updateLeaveBalance = async (
  employeeId,
  leaveTypeId,
  balanceData
) => {
  const { year, allocated_leaves, carried_forward } = balanceData;

  // Validate employee and leave type
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  const leaveType = await LeaveType.findById(leaveTypeId);
  if (!leaveType) {
    throw new AppError("Leave type not found", 404);
  }

  // Find existing balance or create new
  let leaveBalance = await LeaveBalance.findOne({
    emp_id: employeeId,
    leave_type_id: leaveTypeId,
    year,
  });

  if (leaveBalance) {
    // Update existing
    leaveBalance.allocated_leaves = allocated_leaves;
    leaveBalance.carried_forward = carried_forward;
    return await leaveBalance.save();
  } else {
    // Create new
    return await LeaveBalance.create({
      emp_id: employeeId,
      leave_type_id: leaveTypeId,
      year,
      allocated_leaves,
      carried_forward,
      used_leaves: 0,
    });
  }
};

/**
 * Get all leave types
 */
export const getAllLeaveTypes = async () => {
  return await LeaveType.find({}).sort({ leave_name: 1 });
};

/**
 * Get leave type by ID
 */
export const getLeaveTypeById = async (leaveTypeId) => {
  const leaveType = await LeaveType.findById(leaveTypeId);

  if (!leaveType) {
    throw new AppError("Leave type not found", 404);
  }

  return leaveType;
};

/**
 * Create a new leave type
 */
export const createLeaveType = async (leaveTypeData) => {
  // Check if leave code already exists
  const existingLeaveType = await LeaveType.findOne({
    leave_code: leaveTypeData.leave_code,
  });

  if (existingLeaveType) {
    throw new AppError("Leave code already exists", 400);
  }

  return await LeaveType.create(leaveTypeData);
};

/**
 * Update a leave type
 */
export const updateLeaveType = async (leaveTypeId, updateData) => {
  const leaveType = await LeaveType.findById(leaveTypeId);

  if (!leaveType) {
    throw new AppError("Leave type not found", 404);
  }

  // If updating leave code, check if it already exists
  if (updateData.leave_code && updateData.leave_code !== leaveType.leave_code) {
    const existingLeaveType = await LeaveType.findOne({
      leave_code: updateData.leave_code,
    });

    if (existingLeaveType) {
      throw new AppError("Leave code already exists", 400);
    }
  }

  // Update fields
  Object.keys(updateData).forEach((key) => {
    leaveType[key] = updateData[key];
  });

  return await leaveType.save();
};
