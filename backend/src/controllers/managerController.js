import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Attendance from "../models/Attendance.js";
import Department from "../models/Department.js";
import AppError from "../utils/errorHandler.js";

// @desc    Get department statistics for manager's department
// @route   GET /api/manager/department-stats
// @access  Private/Manager
export const getDepartmentStats = asyncHandler(async (req, res) => {
  // Get the manager's employee record to find their department
  const managerEmployee = await Employee.findOne({ user_id: req.user._id })
    .populate('dept_id', 'dept_name')
    .select('dept_id');

  if (!managerEmployee) {
    throw new AppError("Manager employee record not found", 404);
  }

  const departmentId = managerEmployee.dept_id._id;
  const departmentName = managerEmployee.dept_id.dept_name;

  // Get all employees in the manager's department
  const departmentEmployees = await Employee.find({ dept_id: departmentId })
    .populate('user_id', 'full_name');

  const employeeIds = departmentEmployees.map(emp => emp._id);

  // Get today's date for attendance calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's attendance for department employees
  const todayAttendance = await Attendance.find({
    emp_id: { $in: employeeIds },
    check_in: {
      $gte: today,
      $lt: tomorrow
    }
  });

  // Get pending leave requests for department
  const pendingLeaveRequests = await LeaveRequest.find({
    emp_id: { $in: employeeIds },
    status: 'PENDING'
  });

  // Calculate attendance statistics
  const totalEmployees = departmentEmployees.length;
  const presentCount = todayAttendance.length;
  const absentCount = totalEmployees - presentCount;

  // Get employees on approved leave today
  const employeesOnLeave = await LeaveRequest.find({
    emp_id: { $in: employeeIds },
    status: 'APPROVED',
    start_date: { $lte: today },
    end_date: { $gte: today }
  });

  const onLeaveCount = employeesOnLeave.length;

  res.status(200).json({
    departmentName,
    employees: totalEmployees,
    attendance: {
      present: presentCount,
      absent: absentCount - onLeaveCount, // Subtract those on leave from absent
      onLeave: onLeaveCount
    },
    pendingLeaveRequests: pendingLeaveRequests.length
  });
});

// @desc    Get employees in manager's department
// @route   GET /api/manager/employees
// @access  Private/Manager
export const getDepartmentEmployees = asyncHandler(async (req, res) => {
  // Get the manager's employee record to find their department
  const managerEmployee = await Employee.findOne({ user_id: req.user._id })
    .select('dept_id');

  if (!managerEmployee) {
    throw new AppError("Manager employee record not found", 404);
  }

  // Get all employees in the manager's department
  const departmentEmployees = await Employee.find({ 
    dept_id: managerEmployee.dept_id 
  })
    .populate('user_id', 'full_name email')
    .populate('dept_id', 'dept_name')
    .select('user_id dept_id designation hire_date employee_code');

  // Get today's attendance for status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const employeeIds = departmentEmployees.map(emp => emp._id);
  
  const todayAttendance = await Attendance.find({
    emp_id: { $in: employeeIds },
    check_in: {
      $gte: today,
      $lt: tomorrow
    }
  });

  // Get employees on approved leave today
  const employeesOnLeave = await LeaveRequest.find({
    emp_id: { $in: employeeIds },
    status: 'APPROVED',
    start_date: { $lte: today },
    end_date: { $gte: today }
  });

  const attendanceMap = new Map();
  const leaveMap = new Map();

  todayAttendance.forEach(att => {
    attendanceMap.set(att.emp_id.toString(), 'PRESENT');
  });

  employeesOnLeave.forEach(leave => {
    leaveMap.set(leave.emp_id.toString(), 'LEAVE');
  });

  // Format response with status
  const employeesWithStatus = departmentEmployees.map(emp => {
    const empId = emp._id.toString();
    let status = 'ABSENT';
    
    if (leaveMap.has(empId)) {
      status = 'LEAVE';
    } else if (attendanceMap.has(empId)) {
      status = 'PRESENT';
    }

    return {
      _id: emp._id,
      employee_code: emp.employee_code,
      full_name: emp.user_id?.full_name,
      email: emp.user_id?.email,
      designation: emp.designation,
      department: emp.dept_id?.dept_name,
      hire_date: emp.hire_date,
      status
    };
  });

  res.status(200).json(employeesWithStatus);
});

// @desc    Get leave requests for manager's department only
// @route   GET /api/manager/leave-requests
// @access  Private/Manager
export const getDepartmentLeaveRequests = asyncHandler(async (req, res) => {
  const { status = 'PENDING' } = req.query;

  // Get the manager's employee record to find their department
  const managerEmployee = await Employee.findOne({ user_id: req.user._id })
    .select('dept_id');

  if (!managerEmployee) {
    throw new AppError("Manager employee record not found", 404);
  }

  // Get all employees in the manager's department
  const departmentEmployees = await Employee.find({ 
    dept_id: managerEmployee.dept_id 
  }).select('_id');

  const employeeIds = departmentEmployees.map(emp => emp._id);

  // Build filter criteria
  let filterCriteria = {
    emp_id: { $in: employeeIds } // Only employees from manager's department
  };

  if (status && status !== 'ALL') {
    filterCriteria.status = status.toUpperCase();
  }

  // Get leave requests for department employees only
  const leaveRequests = await LeaveRequest.find(filterCriteria)
    .populate({
      path: 'emp_id',
      select: 'user_id employee_code designation dept_id',
      populate: [
        {
          path: 'user_id',
          select: 'full_name email'
        },
        {
          path: 'dept_id',
          select: 'dept_name'
        }
      ]
    })
    .populate('leave_type_id', 'name code description')
    .populate('approved_by', 'user_id')
    .sort({ applied_date: -1 });

  res.status(200).json(leaveRequests);
});

// @desc    Approve leave request (department managers only)
// @route   PUT /api/manager/leave-requests/:id/approve
// @access  Private/Manager
export const approveDepartmentLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comments } = req.body;

  // Get the manager's employee record to find their department
  const managerEmployee = await Employee.findOne({ user_id: req.user._id })
    .select('dept_id _id');

  if (!managerEmployee) {
    throw new AppError("Manager employee record not found", 404);
  }

  // Find the leave request
  const leaveRequest = await LeaveRequest.findById(id)
    .populate({
      path: 'emp_id',
      select: 'dept_id user_id',
      populate: {
        path: 'user_id',
        select: 'full_name'
      }
    })
    .populate('leave_type_id', 'name');

  if (!leaveRequest) {
    throw new AppError("Leave request not found", 404);
  }

  // Check if the leave request is from the manager's department
  if (leaveRequest.emp_id.dept_id.toString() !== managerEmployee.dept_id.toString()) {
    throw new AppError("You can only approve leave requests from your own department", 403);
  }

  // Check if already processed
  if (leaveRequest.status !== 'PENDING') {
    throw new AppError(`Leave request is already ${leaveRequest.status.toLowerCase()}`, 400);
  }

  // Update leave request
  leaveRequest.status = 'APPROVED';
  leaveRequest.approved_by = managerEmployee._id;
  leaveRequest.approved_date = new Date();
  leaveRequest.last_modified = new Date();
  
  if (comments) {
    leaveRequest.manager_comments = comments;
  }

  await leaveRequest.save();

  res.status(200).json({
    success: true,
    message: `Leave request for ${leaveRequest.emp_id.user_id.full_name} has been approved`,
    leaveRequest
  });
});

// @desc    Reject leave request (department managers only)
// @route   PUT /api/manager/leave-requests/:id/reject
// @access  Private/Manager
export const rejectDepartmentLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comments } = req.body;

  // Get the manager's employee record to find their department
  const managerEmployee = await Employee.findOne({ user_id: req.user._id })
    .select('dept_id _id');

  if (!managerEmployee) {
    throw new AppError("Manager employee record not found", 404);
  }

  // Find the leave request
  const leaveRequest = await LeaveRequest.findById(id)
    .populate({
      path: 'emp_id',
      select: 'dept_id user_id',
      populate: {
        path: 'user_id',
        select: 'full_name'
      }
    })
    .populate('leave_type_id', 'name');

  if (!leaveRequest) {
    throw new AppError("Leave request not found", 404);
  }

  // Check if the leave request is from the manager's department
  if (leaveRequest.emp_id.dept_id.toString() !== managerEmployee.dept_id.toString()) {
    throw new AppError("You can only reject leave requests from your own department", 403);
  }

  // Check if already processed
  if (leaveRequest.status !== 'PENDING') {
    throw new AppError(`Leave request is already ${leaveRequest.status.toLowerCase()}`, 400);
  }

  // Update leave request
  leaveRequest.status = 'REJECTED';
  leaveRequest.approved_by = managerEmployee._id;
  leaveRequest.approved_date = new Date();
  leaveRequest.last_modified = new Date();
  
  if (comments) {
    leaveRequest.manager_comments = comments;
  }

  await leaveRequest.save();

  res.status(200).json({
    success: true,
    message: `Leave request for ${leaveRequest.emp_id.user_id.full_name} has been rejected`,
    leaveRequest
  });
});
