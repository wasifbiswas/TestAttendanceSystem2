import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Holiday from "../models/Holiday.js";
import LeaveRequest from "../models/LeaveRequest.js";
import { getDayBoundaries, isWeekend, formatDate } from "../utils/dateUtils.js";
import AppError from "../utils/errorHandler.js";

/**
 * Get all attendance records with optional filtering
 */
export const getAllAttendance = async (filterOptions = {}) => {
  const { startDate, endDate, departmentId, employeeId } = filterOptions;

  // Build filter criteria
  let filterCriteria = {};

  // Date range filter
  if (startDate && endDate) {
    filterCriteria.attendance_date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    filterCriteria.attendance_date = { $gte: new Date(startDate) };
  } else if (endDate) {
    filterCriteria.attendance_date = { $lte: new Date(endDate) };
  }

  // Employee filter
  if (employeeId) {
    filterCriteria.emp_id = employeeId;
  }

  // If department filter is applied, first get all employees from that department
  if (departmentId) {
    const departmentEmployees = await Employee.find({ dept_id: departmentId });
    const employeeIds = departmentEmployees.map((emp) => emp._id);
    filterCriteria.emp_id = { $in: employeeIds };
  }

  return await Attendance.find(filterCriteria)
    .populate({
      path: "emp_id",
      populate: {
        path: "user_id",
        select: "-password_hash",
      },
    })
    .populate("leave_request_id")
    .sort({ attendance_date: -1 });
};

/**
 * Get attendance for a specific employee
 */
export const getEmployeeAttendance = async (employeeId, filterOptions = {}) => {
  const { startDate, endDate } = filterOptions;

  // Validate employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Build filter criteria
  let filterCriteria = { emp_id: employeeId };

  // Date range filter
  if (startDate && endDate) {
    filterCriteria.attendance_date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    filterCriteria.attendance_date = { $gte: new Date(startDate) };
  } else if (endDate) {
    filterCriteria.attendance_date = { $lte: new Date(endDate) };
  }

  return await Attendance.find(filterCriteria)
    .populate({
      path: "emp_id",
      populate: {
        path: "user_id",
        select: "-password_hash",
      },
    })
    .populate("leave_request_id")
    .sort({ attendance_date: -1 });
};

/**
 * Get attendance for a specific date
 */
export const getAttendanceByDate = async (date) => {
  const { startOfDay, endOfDay } = getDayBoundaries(date);

  return await Attendance.find({
    attendance_date: { $gte: startOfDay, $lt: endOfDay },
  })
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
    .sort({ "emp_id.user_id.full_name": 1 });
};

/**
 * Get today's attendance
 */
export const getTodayAttendance = async () => {
  const today = new Date();
  return await getAttendanceByDate(today);
};

/**
 * Create a new attendance record
 */
export const createAttendance = async (attendanceData) => {
  const { emp_id, attendance_date } = attendanceData;

  // Check if attendance record already exists for this employee and date
  const existingAttendance = await Attendance.findOne({
    emp_id,
    attendance_date: {
      $gte: new Date(new Date(attendance_date).setHours(0, 0, 0, 0)),
      $lt: new Date(new Date(attendance_date).setHours(23, 59, 59, 999)),
    },
  });

  if (existingAttendance) {
    throw new AppError("Attendance already recorded for this date", 400);
  }

  return await Attendance.create(attendanceData);
};

/**
 * Register employee check-in
 */
export const checkIn = async (employeeId, checkInTime, remarks) => {
  const today = new Date();
  const { startOfDay, endOfDay } = getDayBoundaries(today);

  // Check if employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Check if already checked in today
  const existingAttendance = await Attendance.findOne({
    emp_id: employeeId,
    attendance_date: { $gte: startOfDay, $lt: endOfDay },
  });

  if (existingAttendance && existingAttendance.check_in) {
    throw new AppError("Already checked in today", 400);
  }

  // Check for holidays
  const holiday = await Holiday.findOne({
    date: { $gte: startOfDay, $lt: endOfDay },
  });

  // Check for approved leaves
  const activeLeave = await LeaveRequest.findOne({
    emp_id: employeeId,
    start_date: { $lte: today },
    end_date: { $gte: today },
    status: "APPROVED",
  });

  let status = "PRESENT";
  let isLeave = false;
  let leaveRequestId = null;

  // Set status based on conditions
  if (activeLeave) {
    status = "LEAVE";
    isLeave = true;
    leaveRequestId = activeLeave._id;
  } else if (holiday) {
    status = "HOLIDAY";
  } else if (isWeekend(today)) {
    status = "WEEKEND";
  }

  // Create or update attendance record
  if (existingAttendance) {
    existingAttendance.check_in = checkInTime || new Date();
    existingAttendance.status = status;
    existingAttendance.is_leave = isLeave;
    existingAttendance.leave_request_id = leaveRequestId;
    existingAttendance.remarks = remarks;

    return await existingAttendance.save();
  } else {
    return await Attendance.create({
      emp_id: employeeId,
      attendance_date: today,
      check_in: checkInTime || new Date(),
      status,
      is_leave: isLeave,
      leave_request_id: leaveRequestId,
      remarks,
    });
  }
};

/**
 * Register employee check-out
 */
export const checkOut = async (employeeId, checkOutTime, remarks) => {
  const today = new Date();
  const { startOfDay, endOfDay } = getDayBoundaries(today);

  // Find today's attendance record
  const attendanceRecord = await Attendance.findOne({
    emp_id: employeeId,
    attendance_date: { $gte: startOfDay, $lt: endOfDay },
  });

  if (!attendanceRecord) {
    throw new AppError("No check-in record found for today", 404);
  }

  if (!attendanceRecord.check_in) {
    throw new AppError("Must check-in before checking out", 400);
  }

  if (attendanceRecord.check_out) {
    throw new AppError("Already checked out today", 400);
  }

  // Update with check-out time
  attendanceRecord.check_out = checkOutTime || new Date();

  // Update remarks if provided
  if (remarks) {
    attendanceRecord.remarks = remarks;
  }

  return await attendanceRecord.save();
};

/**
 * Update an attendance record
 */
export const updateAttendance = async (attendanceId, updateData) => {
  const attendance = await Attendance.findById(attendanceId);

  if (!attendance) {
    throw new AppError("Attendance record not found", 404);
  }

  // Update fields
  Object.keys(updateData).forEach((key) => {
    attendance[key] = updateData[key];
  });

  return await attendance.save();
};

/**
 * Delete an attendance record
 */
export const deleteAttendance = async (attendanceId) => {
  const attendance = await Attendance.findById(attendanceId);

  if (!attendance) {
    throw new AppError("Attendance record not found", 404);
  }

  await attendance.deleteOne();
  return { success: true, message: "Attendance record deleted" };
};

/**
 * Bulk create attendance records
 */
export const bulkCreateAttendance = async (attendanceRecords) => {
  // Validate each record for duplicates
  for (const record of attendanceRecords) {
    const { emp_id, attendance_date } = record;

    const existingAttendance = await Attendance.findOne({
      emp_id,
      attendance_date: {
        $gte: new Date(new Date(attendance_date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(attendance_date).setHours(23, 59, 59, 999)),
      },
    });

    if (existingAttendance) {
      throw new AppError(
        `Attendance already exists for employee ID ${emp_id} on ${formatDate(
          attendance_date
        )}`,
        400
      );
    }
  }

  return await Attendance.insertMany(attendanceRecords);
};
