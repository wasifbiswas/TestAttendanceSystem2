import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import AppError from "../utils/errorHandler.js";
import { getDayBoundaries } from "../utils/dateUtils.js";

// @desc    Get user's attendance summary
// @route   GET /api/user/attendance/summary
// @access  Private
export const getAttendanceSummary = asyncHandler(async (req, res) => {
  try {
    console.log("User ID from request:", req.user._id);

    // Get the current user's employee record
    const employee = await Employee.findOne({ user_id: req.user._id });
    console.log("Employee found:", employee ? "Yes" : "No");

    if (!employee) {
      console.log("No employee record found, returning default data");
      // Return default data for users without employee profiles
      return res.json({
        stats: {
          present: 0,
          absent: 0,
          late: 0,
          leaves: 0,
        },
        leaveBalance: {
          annual: 0,
          sick: 0,
          casual: 0,
        },
        message:
          "No employee profile found. Please contact HR to set up your profile.",
      });
    }

    console.log("Employee ID:", employee._id);

    // Get attendance statistics
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    console.log("Start of year:", startOfYear);

    try {
      // Convert employee._id to ObjectId if it's not already
      const employeeId = mongoose.Types.ObjectId.isValid(employee._id)
        ? employee._id
        : new mongoose.Types.ObjectId(employee._id.toString());

      // Get attendance counts
      const attendanceStats = await Attendance.aggregate([
        {
          $match: {
            emp_id: employeeId,
            attendance_date: { $gte: startOfYear },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      console.log("Attendance stats:", JSON.stringify(attendanceStats));

      // Process attendance stats
      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        leaves: 0,
      };

      attendanceStats.forEach((stat) => {
        if (stat._id === "PRESENT") {
          stats.present = stat.count;
        } else if (stat._id === "ABSENT") {
          stats.absent = stat.count;
        } else if (stat._id === "LEAVE") {
          stats.leaves = stat.count;
        }
      });

      // Get leave balance (in a real app, you would calculate this from the database)
      const leaveBalance = {
        annual: 20, // Default values
        sick: 10,
        casual: 5,
      };

      // Return the summary
      res.json({
        stats,
        leaveBalance,
      });
    } catch (aggregateError) {
      console.error("Error during aggregation:", aggregateError);
      throw new Error(`Aggregation failed: ${aggregateError.message}`);
    }
  } catch (error) {
    console.error("Error in getAttendanceSummary:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500);
    throw new AppError(
      `Could not fetch attendance summary: ${error.message}`,
      500
    );
  }
});

// @desc    Get current user's leave requests
// @route   GET /api/user/leaves
// @access  Private
export const getUserLeaves = asyncHandler(async (req, res) => {
  try {
    console.log("Getting leave requests for user:", req.user._id);

    // Get the current user's employee record
    const employee = await Employee.findOne({ user_id: req.user._id });

    if (!employee) {
      console.log("No employee record found, returning empty array");
      return res.json([]);
    }

    // Get leave requests for this employee
    const leaveRequests = await LeaveRequest.find({ emp_id: employee._id })
      .populate("leave_type_id")
      .populate("approved_by")
      .sort({ applied_date: -1 });

    console.log(`Found ${leaveRequests.length} leave requests`);
    res.json(leaveRequests);
  } catch (error) {
    console.error("Error in getUserLeaves:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500);
    throw new AppError(`Could not fetch user leaves: ${error.message}`, 500);
  }
});
