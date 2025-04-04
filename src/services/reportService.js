import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveType from "../models/LeaveType.js";
import LeaveBalance from "../models/LeaveBalance.js";
import User from "../models/User.js";
import { getDayBoundaries } from "../utils/dateUtils.js";
import AppError from "../utils/errorHandler.js";

/**
 * Get system statistics for admin dashboard
 */
export const getSystemStats = async () => {
  // Get counts
  const userCount = await User.countDocuments();
  const employeeCount = await Employee.countDocuments();
  const departmentCount = await Department.countDocuments();

  // Get today's attendance
  const today = new Date();
  const { startOfDay, endOfDay } = getDayBoundaries(today);

  const todayAttendance = await Attendance.countDocuments({
    attendance_date: { $gte: startOfDay, $lt: endOfDay },
  });

  const presentToday = await Attendance.countDocuments({
    attendance_date: { $gte: startOfDay, $lt: endOfDay },
    status: "PRESENT",
  });

  const absentToday = await Attendance.countDocuments({
    attendance_date: { $gte: startOfDay, $lt: endOfDay },
    status: "ABSENT",
  });

  const onLeaveToday = await Attendance.countDocuments({
    attendance_date: { $gte: startOfDay, $lt: endOfDay },
    status: "LEAVE",
  });

  // Get pending leave requests
  const pendingLeaveRequests = await LeaveRequest.countDocuments({
    status: "PENDING",
  });

  // Get department-wise employee count
  const departments = await Department.find({});
  const departmentStats = [];

  for (const department of departments) {
    const count = await Employee.countDocuments({ dept_id: department._id });
    departmentStats.push({
      department: department.dept_name,
      employeeCount: count,
    });
  }

  return {
    users: userCount,
    employees: employeeCount,
    departments: departmentCount,
    attendance: {
      total: todayAttendance,
      present: presentToday,
      absent: absentToday,
      onLeave: onLeaveToday,
    },
    pendingLeaveRequests,
    departmentStats,
  };
};

/**
 * Generate attendance report for a date range
 */
export const generateAttendanceReport = async (options = {}) => {
  const { startDate, endDate, departmentId, employeeId } = options;

  if (!startDate || !endDate) {
    throw new AppError("Start date and end date are required", 400);
  }

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError("Invalid date format", 400);
  }

  if (start > end) {
    throw new AppError("Start date must be before end date", 400);
  }

  // Build filter criteria
  let employeeFilter = {};

  if (employeeId) {
    employeeFilter = { _id: employeeId };
  } else if (departmentId) {
    employeeFilter = { dept_id: departmentId };
  }

  // Get all relevant employees
  const employees = await Employee.find(employeeFilter)
    .populate("user_id", "-password_hash")
    .populate("dept_id");

  const report = [];

  // For each employee, get attendance data for date range
  for (const employee of employees) {
    const attendanceRecords = await Attendance.find({
      emp_id: employee._id,
      attendance_date: { $gte: start, $lte: end },
    }).sort({ attendance_date: 1 });

    // Calculate summary statistics
    const present = attendanceRecords.filter(
      (a) => a.status === "PRESENT"
    ).length;
    const absent = attendanceRecords.filter(
      (a) => a.status === "ABSENT"
    ).length;
    const leave = attendanceRecords.filter((a) => a.status === "LEAVE").length;
    const halfDay = attendanceRecords.filter(
      (a) => a.status === "HALF_DAY"
    ).length;
    const holiday = attendanceRecords.filter(
      (a) => a.status === "HOLIDAY"
    ).length;
    const weekend = attendanceRecords.filter(
      (a) => a.status === "WEEKEND"
    ).length;

    // Calculate average work hours
    const workHoursRecords = attendanceRecords.filter((a) => a.work_hours > 0);
    const totalWorkHours = workHoursRecords.reduce(
      (sum, record) => sum + record.work_hours,
      0
    );
    const avgWorkHours = workHoursRecords.length
      ? totalWorkHours / workHoursRecords.length
      : 0;

    report.push({
      employeeId: employee._id,
      employeeCode: employee.employee_code,
      name: employee.user_id?.full_name || "Unknown",
      department: employee.dept_id?.dept_name || "Unknown",
      summary: {
        present,
        absent,
        leave,
        halfDay,
        holiday,
        weekend,
        totalDays: attendanceRecords.length,
        avgWorkHours: parseFloat(avgWorkHours.toFixed(2)),
      },
      records: attendanceRecords,
    });
  }

  return report;
};

/**
 * Generate leave report for a date range
 */
export const generateLeaveReport = async (options = {}) => {
  const { startDate, endDate, departmentId, employeeId, leaveTypeId, status } =
    options;

  if (!startDate || !endDate) {
    throw new AppError("Start date and end date are required", 400);
  }

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError("Invalid date format", 400);
  }

  if (start > end) {
    throw new AppError("Start date must be before end date", 400);
  }

  // Build filter criteria for leave requests
  let leaveFilter = {
    $or: [
      { start_date: { $gte: start, $lte: end } },
      { end_date: { $gte: start, $lte: end } },
      {
        start_date: { $lte: start },
        end_date: { $gte: end },
      },
    ],
  };

  if (employeeId) {
    leaveFilter.emp_id = employeeId;
  }

  if (leaveTypeId) {
    leaveFilter.leave_type_id = leaveTypeId;
  }

  if (status) {
    leaveFilter.status = status;
  }

  // If department filter is applied, first get all employees from that department
  if (departmentId && !employeeId) {
    const departmentEmployees = await Employee.find({ dept_id: departmentId });
    const employeeIds = departmentEmployees.map((emp) => emp._id);
    leaveFilter.emp_id = { $in: employeeIds };
  }

  // Get leave requests matching the criteria
  const leaveRequests = await LeaveRequest.find(leaveFilter)
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
    .sort({ start_date: 1 });

  // Get all leave types for summary
  const leaveTypes = await LeaveType.find({});

  // Calculate summary statistics by leave type
  const summary = {};

  leaveTypes.forEach((leaveType) => {
    summary[leaveType.leave_code] = {
      leave_name: leaveType.leave_name,
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      cancelled: 0,
      totalDays: 0,
    };
  });

  leaveRequests.forEach((leave) => {
    const leaveCode = leave.leave_type_id.leave_code;

    if (summary[leaveCode]) {
      summary[leaveCode].total += 1;
      summary[leaveCode][leave.status.toLowerCase()] += 1;

      if (leave.status === "APPROVED" || leave.status === "PENDING") {
        summary[leaveCode].totalDays += leave.duration;
      }
    }
  });

  return {
    summary: Object.values(summary),
    leaves: leaveRequests,
  };
};

/**
 * Generate employee attendance summary report
 */
export const generateEmployeeAttendanceSummary = async (
  employeeId,
  year,
  month
) => {
  if (!employeeId) {
    throw new AppError("Employee ID is required", 400);
  }

  // Validate employee exists
  const employee = await Employee.findById(employeeId)
    .populate("user_id", "-password_hash")
    .populate("dept_id");

  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Default to current year and month if not provided
  const currentDate = new Date();
  const reportYear = year || currentDate.getFullYear();
  const reportMonth = month !== undefined ? month : currentDate.getMonth();

  // Set date range for the month (or whole year if month not specified)
  let startDate, endDate;

  if (month !== undefined) {
    startDate = new Date(reportYear, reportMonth, 1);
    endDate = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);
  } else {
    startDate = new Date(reportYear, 0, 1);
    endDate = new Date(reportYear, 11, 31, 23, 59, 59, 999);
  }

  // Get attendance records for the specified period
  const attendanceRecords = await Attendance.find({
    emp_id: employeeId,
    attendance_date: { $gte: startDate, $lte: endDate },
  }).sort({ attendance_date: 1 });

  // Calculate summary
  const present = attendanceRecords.filter(
    (a) => a.status === "PRESENT"
  ).length;
  const absent = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const leave = attendanceRecords.filter((a) => a.status === "LEAVE").length;
  const halfDay = attendanceRecords.filter(
    (a) => a.status === "HALF_DAY"
  ).length;
  const holiday = attendanceRecords.filter(
    (a) => a.status === "HOLIDAY"
  ).length;
  const weekend = attendanceRecords.filter(
    (a) => a.status === "WEEKEND"
  ).length;

  // Calculate work hours
  const workHoursRecords = attendanceRecords.filter((a) => a.work_hours > 0);
  const totalWorkHours = workHoursRecords.reduce(
    (sum, record) => sum + record.work_hours,
    0
  );
  const avgWorkHours = workHoursRecords.length
    ? totalWorkHours / workHoursRecords.length
    : 0;

  // Monthly breakdown (if year summary requested)
  let monthlyBreakdown = null;

  if (month === undefined) {
    monthlyBreakdown = [];

    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(reportYear, m, 1);
      const monthEnd = new Date(reportYear, m + 1, 0, 23, 59, 59, 999);

      const monthRecords = attendanceRecords.filter(
        (a) => a.attendance_date >= monthStart && a.attendance_date <= monthEnd
      );

      const monthPresent = monthRecords.filter(
        (a) => a.status === "PRESENT"
      ).length;
      const monthAbsent = monthRecords.filter(
        (a) => a.status === "ABSENT"
      ).length;
      const monthLeave = monthRecords.filter(
        (a) => a.status === "LEAVE"
      ).length;

      monthlyBreakdown.push({
        month: monthStart.toLocaleString("default", { month: "long" }),
        present: monthPresent,
        absent: monthAbsent,
        leave: monthLeave,
        total: monthRecords.length,
      });
    }
  }

  return {
    employee: {
      id: employee._id,
      code: employee.employee_code,
      name: employee.user_id?.full_name || "Unknown",
      department: employee.dept_id?.dept_name || "Unknown",
      designation: employee.designation,
    },
    period: {
      year: reportYear,
      month:
        month !== undefined
          ? new Date(reportYear, reportMonth, 1).toLocaleString("default", {
              month: "long",
            })
          : null,
      startDate,
      endDate,
    },
    summary: {
      present,
      absent,
      leave,
      halfDay,
      holiday,
      weekend,
      totalDays: attendanceRecords.length,
      workHours: {
        total: parseFloat(totalWorkHours.toFixed(2)),
        average: parseFloat(avgWorkHours.toFixed(2)),
      },
      attendance_percentage: attendanceRecords.length
        ? parseFloat((present / (present + absent + halfDay)) * 100).toFixed(2)
        : 0,
    },
    monthlyBreakdown,
    records: attendanceRecords,
  };
};

/**
 * Generate department-wise attendance report
 */
export const generateDepartmentAttendanceReport = async (options = {}) => {
  const { startDate, endDate, departmentId } = options;

  if (!startDate || !endDate) {
    throw new AppError("Start date and end date are required", 400);
  }

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError("Invalid date format", 400);
  }

  if (start > end) {
    throw new AppError("Start date must be before end date", 400);
  }

  // Get departments (either specific one or all)
  let departments;
  if (departmentId) {
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new AppError("Department not found", 404);
    }
    departments = [department];
  } else {
    departments = await Department.find({});
  }

  const report = [];

  // For each department, get attendance data
  for (const department of departments) {
    // Get all employees in the department
    const employees = await Employee.find({ dept_id: department._id });
    const employeeIds = employees.map((e) => e._id);

    // Skip if no employees in department
    if (employeeIds.length === 0) {
      report.push({
        department: department.dept_name,
        employeeCount: 0,
        summary: {
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
          presentPercentage: 0,
        },
      });
      continue;
    }

    // Get attendance records for all employees in the department
    const attendanceRecords = await Attendance.find({
      emp_id: { $in: employeeIds },
      attendance_date: { $gte: start, $lte: end },
    });

    // Calculate department summary
    const present = attendanceRecords.filter(
      (a) => a.status === "PRESENT"
    ).length;
    const absent = attendanceRecords.filter(
      (a) => a.status === "ABSENT"
    ).length;
    const leave = attendanceRecords.filter((a) => a.status === "LEAVE").length;
    const holiday = attendanceRecords.filter(
      (a) => a.status === "HOLIDAY"
    ).length;
    const weekend = attendanceRecords.filter(
      (a) => a.status === "WEEKEND"
    ).length;

    const totalWorkdays = present + absent + leave;
    const presentPercentage = totalWorkdays
      ? parseFloat((present / totalWorkdays) * 100).toFixed(2)
      : 0;

    report.push({
      department: department.dept_name,
      departmentId: department._id,
      employeeCount: employees.length,
      summary: {
        present,
        absent,
        leave,
        holiday,
        weekend,
        total: attendanceRecords.length,
        presentPercentage,
      },
    });
  }

  return report;
};

/**
 * Generate employee leave balance report
 */
export const generateLeaveBalanceReport = async (options = {}) => {
  const { departmentId, employeeId, year } = options;

  // Use current year if not specified
  const reportYear = year || new Date().getFullYear();

  // Build employee filter
  let employeeFilter = {};

  if (employeeId) {
    employeeFilter = { _id: employeeId };
  } else if (departmentId) {
    employeeFilter = { dept_id: departmentId };
  }

  // Get employees
  const employees = await Employee.find(employeeFilter)
    .populate("user_id", "-password_hash")
    .populate("dept_id");

  const report = [];

  // Get all leave types
  const leaveTypes = await LeaveType.find({});

  // For each employee, get leave balance data
  for (const employee of employees) {
    // Get leave balances for the employee
    const leaveBalances = await getEmployeeLeaveBalances(
      employee._id,
      reportYear
    );

    report.push({
      employee: {
        id: employee._id,
        code: employee.employee_code,
        name: employee.user_id?.full_name || "Unknown",
        department: employee.dept_id?.dept_name || "Unknown",
        designation: employee.designation,
      },
      balances: leaveBalances,
    });
  }

  return report;
};

/**
 * Helper function to get employee leave balances
 */
async function getEmployeeLeaveBalances(employeeId, year) {
  // Get all leave types
  const leaveTypes = await LeaveType.find({});

  // Get leave balances from database
  const balances = await LeaveBalance.find({
    emp_id: employeeId,
    year,
  }).populate("leave_type_id");

  // Create a map of existing balances
  const balanceMap = {};
  balances.forEach((balance) => {
    if (balance.leave_type_id) {
      balanceMap[balance.leave_type_id._id.toString()] = balance;
    }
  });

  // Format the result with all leave types
  const result = [];

  for (const leaveType of leaveTypes) {
    const leaveTypeId = leaveType._id.toString();

    if (balanceMap[leaveTypeId]) {
      // Use existing balance
      const balance = balanceMap[leaveTypeId];
      result.push({
        leave_type: leaveType.leave_name,
        leave_code: leaveType.leave_code,
        allocated: balance.allocated_leaves,
        carried_forward: balance.carried_forward,
        used: balance.used_leaves,
        available:
          balance.allocated_leaves +
          balance.carried_forward -
          balance.used_leaves,
      });
    } else {
      // Create default entry
      result.push({
        leave_type: leaveType.leave_name,
        leave_code: leaveType.leave_code,
        allocated: leaveType.default_annual_quota,
        carried_forward: 0,
        used: 0,
        available: leaveType.default_annual_quota,
      });
    }
  }

  return result;
}
