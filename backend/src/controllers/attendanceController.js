import asyncHandler from "express-async-handler";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Holiday from "../models/Holiday.js";
import LeaveRequest from "../models/LeaveRequest.js";
import AppError from "../utils/errorHandler.js";
import { getDayBoundaries, isWeekend, formatDate } from "../utils/dateUtils.js";

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private/Admin
export const getAllAttendance = asyncHandler(async (req, res) => {
  const { start_date, end_date, department, employee_id } = req.query;

  // Build filter criteria
  let filterCriteria = {};

  // Date range filter
  if (start_date && end_date) {
    filterCriteria.attendance_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date),
    };
  } else if (start_date) {
    filterCriteria.attendance_date = { $gte: new Date(start_date) };
  } else if (end_date) {
    filterCriteria.attendance_date = { $lte: new Date(end_date) };
  }

  // Employee filter
  if (employee_id) {
    filterCriteria.emp_id = employee_id;
  }

  // If department filter is applied, first get all employees from that department
  if (department) {
    const departmentEmployees = await Employee.find({ dept_id: department });
    const employeeIds = departmentEmployees.map((emp) => emp._id);
    filterCriteria.emp_id = { $in: employeeIds };
  }

  const attendance = await Attendance.find(filterCriteria)
    .populate({
      path: "emp_id",
      populate: {
        path: "user_id",
        select: "-password_hash",
      },
    })
    .populate("leave_request_id")
    .sort({ attendance_date: -1 });

  res.json(attendance);
});

// @desc    Get employee attendance
// @route   GET /api/attendance/employee/:employeeId
// @access  Private/Admin/Manager/Self
export const getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { start_date, end_date } = req.query;

  // Validate employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }

  // Build filter criteria
  let filterCriteria = { emp_id: employeeId };

  // Date range filter
  if (start_date && end_date) {
    filterCriteria.attendance_date = {
      $gte: new Date(start_date),
      $lte: new Date(end_date),
    };
  } else if (start_date) {
    filterCriteria.attendance_date = { $gte: new Date(start_date) };
  } else if (end_date) {
    filterCriteria.attendance_date = { $lte: new Date(end_date) };
  }

  const attendance = await Attendance.find(filterCriteria)
    .populate({
      path: "emp_id",
      populate: {
        path: "user_id",
        select: "-password_hash",
      },
    })
    .populate("leave_request_id")
    .sort({ attendance_date: -1 });

  res.json(attendance);
});

// @desc    Get attendance by date
// @route   GET /api/attendance/date/:date
// @access  Private/Admin/Manager
export const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;

  // Parse the date
  const targetDate = new Date(date);

  // Get day boundaries
  const { startOfDay, endOfDay } = getDayBoundaries(targetDate);

  const attendance = await Attendance.find({
    attendance_date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  })
    .populate({
      path: "emp_id",
      populate: {
        path: "user_id",
        select: "-password_hash",
      },
    })
    .populate("leave_request_id")
    .sort({ attendance_date: -1 });

  res.json(attendance);
});

// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Private/Admin/Manager
export const getTodayAttendance = asyncHandler(async (req, res) => {
  const today = new Date();
  const { startOfDay, endOfDay } = getDayBoundaries(today);

  const attendance = await Attendance.find({
    attendance_date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  })
    .populate({
      path: "emp_id",
      populate: {
        path: "user_id",
        select: "-password_hash",
      },
    })
    .populate("leave_request_id")
    .sort({ attendance_date: -1 });

  res.json(attendance);
});

// @desc    Create attendance record
// @route   POST /api/attendance
// @access  Private/Admin
export const createAttendance = asyncHandler(async (req, res) => {
  const {
    emp_id,
    attendance_date,
    check_in,
    check_out,
    status,
    is_leave,
    leave_request_id,
    remarks,
  } = req.body;

  // Validate employee exists
  const employee = await Employee.findById(emp_id);
  if (!employee) {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }

  // Check if leave request is valid if provided
  if (leave_request_id) {
    const leaveRequest = await LeaveRequest.findById(leave_request_id);
    if (!leaveRequest) {
      res.status(404);
      throw new AppError("Leave request not found", 404);
    }

    // Check if leave belongs to the employee
    if (leaveRequest.emp_id.toString() !== emp_id) {
      res.status(400);
      throw new AppError("Leave request does not belong to this employee", 400);
    }
  }

  // Check for existing attendance record on the same date
  const attendanceDate = new Date(attendance_date);
  const { startOfDay, endOfDay } = getDayBoundaries(attendanceDate);

  const existingAttendance = await Attendance.findOne({
    emp_id,
    attendance_date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (existingAttendance) {
    res.status(400);
    throw new AppError("Attendance record already exists for this date", 400);
  }

  // Create attendance record
  const attendance = await Attendance.create({
    emp_id,
    attendance_date: attendanceDate,
    check_in: check_in ? new Date(check_in) : null,
    check_out: check_out ? new Date(check_out) : null,
    status: status || "ABSENT",
    is_leave: is_leave || false,
    leave_request_id: leave_request_id || null,
    remarks,
  });

  res.status(201).json(attendance);
});

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Admin
export const updateAttendance = asyncHandler(async (req, res) => {
  const { check_in, check_out, status, is_leave, leave_request_id, remarks } =
    req.body;

  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    res.status(404);
    throw new AppError("Attendance record not found", 404);
  }

  // Update fields
  if (check_in) attendance.check_in = new Date(check_in);
  if (check_out) attendance.check_out = new Date(check_out);
  if (status) attendance.status = status;
  if (is_leave !== undefined) attendance.is_leave = is_leave;
  if (leave_request_id) attendance.leave_request_id = leave_request_id;
  if (remarks) attendance.remarks = remarks;

  const updatedAttendance = await attendance.save();

  res.json(updatedAttendance);
});

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
export const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    res.status(404);
    throw new AppError("Attendance record not found", 404);
  }

  await attendance.deleteOne();

  res.json({ message: "Attendance record removed" });
});

// @desc    Check-in
// @route   POST /api/attendance/check-in
// @access  Private
export const checkIn = asyncHandler(async (req, res) => {
  const { emp_id, check_in, remarks } = req.body;

  // Validate employee exists
  const employee = await Employee.findById(emp_id);
  if (!employee) {
    res.status(404);
    throw new AppError("Employee not found", 404);
  }

  // Check if it's a holiday
  const today = new Date();
  const { startOfDay, endOfDay } = getDayBoundaries(today);

  const holiday = await Holiday.findOne({
    holiday_date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  // Check if it's a weekend
  const isWeekendDay = isWeekend(today);

  // Check if employee is on leave
  const leaveRequest = await LeaveRequest.findOne({
    emp_id,
    start_date: { $lte: today },
    end_date: { $gte: today },
    status: "APPROVED",
  });

  // Determine status based on conditions
  let status = "PRESENT";
  if (holiday) {
    status = "HOLIDAY";
  } else if (isWeekendDay) {
    status = "WEEKEND";
  } else if (leaveRequest) {
    status = "LEAVE";
  }

  // Check for existing attendance record today
  const existingAttendance = await Attendance.findOne({
    emp_id,
    attendance_date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  let attendance;
  if (existingAttendance) {
    // Update existing record
    existingAttendance.check_in = check_in ? new Date(check_in) : new Date();
    existingAttendance.status = status;
    if (leaveRequest) {
      existingAttendance.is_leave = true;
      existingAttendance.leave_request_id = leaveRequest._id;
    }
    if (remarks) existingAttendance.remarks = remarks;

    attendance = await existingAttendance.save();
  } else {
    // Create new attendance record
    attendance = await Attendance.create({
      emp_id,
      attendance_date: today,
      check_in: check_in ? new Date(check_in) : new Date(),
      status,
      is_leave: leaveRequest ? true : false,
      leave_request_id: leaveRequest ? leaveRequest._id : null,
      remarks,
    });
  }

  res.status(201).json(attendance);
});

// @desc    Check-out
// @route   POST /api/attendance/check-out
// @access  Private
export const checkOut = asyncHandler(async (req, res) => {
  const { emp_id, check_out, remarks } = req.body;

  // Get today's date
  const today = new Date();
  const { startOfDay, endOfDay } = getDayBoundaries(today);

  // Find existing attendance record
  const attendance = await Attendance.findOne({
    emp_id,
    attendance_date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (!attendance) {
    res.status(404);
    throw new AppError("No check-in record found for today", 404);
  }

  // Update check-out time
  attendance.check_out = check_out ? new Date(check_out) : new Date();
  if (remarks) attendance.remarks = remarks;

  const updatedAttendance = await attendance.save();

  res.json(updatedAttendance);
});

// @desc    Bulk create attendance
// @route   POST /api/attendance/bulk
// @access  Private/Admin
export const bulkCreateAttendance = asyncHandler(async (req, res) => {
  const { emp_ids, attendance_date, status, remarks } = req.body;

  if (!emp_ids || !emp_ids.length) {
    res.status(400);
    throw new AppError("Employee IDs are required", 400);
  }

  // Validate all employees exist
  const employees = await Employee.find({ _id: { $in: emp_ids } });
  if (employees.length !== emp_ids.length) {
    res.status(400);
    throw new AppError("Some employee IDs are invalid", 400);
  }

  // Parse date
  const attendanceDate = attendance_date
    ? new Date(attendance_date)
    : new Date();
  const { startOfDay, endOfDay } = getDayBoundaries(attendanceDate);

  // Check for existing attendance records
  const existingAttendance = await Attendance.find({
    emp_id: { $in: emp_ids },
    attendance_date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  // Create a map of existing attendance records by employee ID
  const existingAttendanceMap = existingAttendance.reduce((map, record) => {
    map[record.emp_id.toString()] = record;
    return map;
  }, {});

  // Prepare bulk operations
  const bulkOperations = [];
  const attendanceStatus = status || "PRESENT";

  // Process each employee
  for (const empId of emp_ids) {
    const stringEmpId = empId.toString();
    if (existingAttendanceMap[stringEmpId]) {
      // Update existing record
      bulkOperations.push({
        updateOne: {
          filter: { _id: existingAttendanceMap[stringEmpId]._id },
          update: {
            $set: {
              status: attendanceStatus,
              remarks: remarks || existingAttendanceMap[stringEmpId].remarks,
            },
          },
        },
      });
    } else {
      // Create new record
      bulkOperations.push({
        insertOne: {
          document: {
            emp_id: empId,
            attendance_date: attendanceDate,
            status: attendanceStatus,
            remarks,
          },
        },
      });
    }
  }

  // Execute bulk operations
  await Attendance.bulkWrite(bulkOperations);

  res.status(201).json({
    message: `Attendance processed for ${emp_ids.length} employees`,
    date: formatDate(attendanceDate),
    status: attendanceStatus,
  });
});
