import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserRole from "../models/UserRole.js";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import AppError from "../utils/errorHandler.js";

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password_hash");
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password_hash");

  if (user) {
    // Get user roles
    const userRoles = await UserRole.find({ user_id: user._id }).populate(
      "role_id"
    );
    const roles = userRoles.map((userRole) => userRole.role_id.role_name);

    // Get employee profile if exists
    const employee = await Employee.findOne({ user_id: user._id })
      .populate("dept_id")
      .populate("reporting_manager_id");

    res.json({
      user,
      roles,
      employee,
    });
  } else {
    res.status(404);
    throw new AppError("User not found", 404);
  }
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.full_name = req.body.full_name || user.full_name;
    user.contact_number = req.body.contact_number || user.contact_number;
    user.is_active =
      req.body.is_active !== undefined ? req.body.is_active : user.is_active;

    if (req.body.password) {
      user.password_hash = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      join_date: updatedUser.join_date,
      is_active: updatedUser.is_active,
      contact_number: updatedUser.contact_number,
    });
  } else {
    res.status(404);
    throw new AppError("User not found", 404);
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new AppError("User not found", 404);
  }

  // Check if user has employee profile
  const employee = await Employee.findOne({ user_id: user._id });
  if (employee) {
    res.status(400);
    throw new AppError(
      "Cannot delete user with employee profile. Delete employee profile first.",
      400
    );
  }

  await UserRole.deleteMany({ user_id: user._id });
  await user.deleteOne();

  res.json({ message: "User removed" });
});

// @desc    Assign role to user
// @route   POST /api/admin/users/:id/roles
// @access  Private/Admin
export const assignRole = asyncHandler(async (req, res) => {
  const { role_id } = req.body;
  const userId = req.params.id;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new AppError("User not found", 404);
  }

  // Check if role exists
  const role = await Role.findById(role_id);
  if (!role) {
    res.status(404);
    throw new AppError("Role not found", 404);
  }

  // Check if user already has this role
  const existingUserRole = await UserRole.findOne({
    user_id: userId,
    role_id,
  });

  if (existingUserRole) {
    const message = "User already has this role";
    res.status(400).json({
      status: "fail",
      message,
    });
    return; // Early return to prevent further execution
  }

  // Assign role to user
  const userRole = await UserRole.create({
    user_id: userId,
    role_id,
    assigned_date: new Date(),
  });

  res.status(201).json({
    message: "Role assigned successfully",
    userRole,
  });
});

// @desc    Remove role from user
// @route   DELETE /api/admin/users/:userId/roles/:roleId
// @access  Private/Admin
export const removeRole = asyncHandler(async (req, res) => {
  const { userId, roleId } = req.params;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new AppError("User not found", 404);
  }

  // Check if user-role mapping exists
  const userRole = await UserRole.findOne({
    user_id: userId,
    role_id: roleId,
  });

  if (!userRole) {
    res.status(404);
    throw new AppError("User does not have this role", 404);
  }

  // Remove role from user
  await userRole.deleteOne();

  res.json({
    message: "Role removed successfully",
  });
});

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getSystemStats = asyncHandler(async (req, res) => {
  // Get counts
  const userCount = await User.countDocuments();
  const employeeCount = await Employee.countDocuments();
  const departmentCount = await Department.countDocuments();

  // Get today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAttendance = await Attendance.countDocuments({
    attendance_date: { $gte: today, $lt: tomorrow },
  });

  const presentToday = await Attendance.countDocuments({
    attendance_date: { $gte: today, $lt: tomorrow },
    status: "PRESENT",
  });

  const absentToday = await Attendance.countDocuments({
    attendance_date: { $gte: today, $lt: tomorrow },
    status: "ABSENT",
  });

  const onLeaveToday = await Attendance.countDocuments({
    attendance_date: { $gte: today, $lt: tomorrow },
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

  res.json({
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
  });
});

// @desc    Get user counts by role with employee IDs
// @route   GET /api/admin/users/role-counts
// @access  Private/Admin
export const getUserRoleCounts = asyncHandler(async (req, res) => {
  // Find role IDs for employee, manager, and admin roles
  const employeeRole = await Role.findOne({ role_name: "EMPLOYEE" });
  const managerRole = await Role.findOne({ role_name: "MANAGER" });
  const adminRole = await Role.findOne({ role_name: "ADMIN" });

  // Initialize result object
  const result = {
    employees: { count: 0, ids: [] },
    managers: { count: 0, ids: [] },
    admins: { count: 0, ids: [] },
  };

  // If roles exist, get users with these roles
  if (employeeRole) {
    const employeeUserRoles = await UserRole.find({
      role_id: employeeRole._id,
    }).populate("user_id", "-password_hash");
    result.employees.count = employeeUserRoles.length;

    // Get employee IDs (use employee code if available)
    for (const userRole of employeeUserRoles) {
      if (userRole.user_id) {
        const employee = await Employee.findOne({
          user_id: userRole.user_id._id,
        });
        if (employee && employee.employee_code) {
          result.employees.ids.push(employee.employee_code);
        } else {
          result.employees.ids.push(userRole.user_id._id.toString());
        }
      }
    }
  }

  if (managerRole) {
    const managerUserRoles = await UserRole.find({
      role_id: managerRole._id,
    }).populate("user_id", "-password_hash");
    result.managers.count = managerUserRoles.length;

    // Get manager IDs (use employee code if available)
    for (const userRole of managerUserRoles) {
      if (userRole.user_id) {
        const employee = await Employee.findOne({
          user_id: userRole.user_id._id,
        });
        if (employee && employee.employee_code) {
          result.managers.ids.push(employee.employee_code);
        } else {
          result.managers.ids.push(userRole.user_id._id.toString());
        }
      }
    }
  }

  if (adminRole) {
    const adminUserRoles = await UserRole.find({
      role_id: adminRole._id,
    }).populate("user_id", "-password_hash");
    result.admins.count = adminUserRoles.length;

    // Get admin IDs (use employee code if available)
    for (const userRole of adminUserRoles) {
      if (userRole.user_id) {
        const employee = await Employee.findOne({
          user_id: userRole.user_id._id,
        });
        if (employee && employee.employee_code) {
          result.admins.ids.push(employee.employee_code);
        } else {
          result.admins.ids.push(userRole.user_id._id.toString());
        }
      }
    }
  }

  res.json(result);
});
