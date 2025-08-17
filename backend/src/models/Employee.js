import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dept_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    hire_date: {
      type: Date,
      default: Date.now,
    },
    employee_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reporting_manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
  }
);

// Cascade delete - clean up related data when employee is deleted
employeeSchema.pre(["deleteOne", "findOneAndDelete"], async function (next) {
  try {
    const employeeId = this.getQuery()._id;
    console.log(`Cleaning up related data for employee: ${employeeId}`);

    // Import models inside the hook to avoid circular dependency issues
    const Attendance = mongoose.model("Attendance");
    const LeaveRequest = mongoose.model("LeaveRequest");
    const LeaveBalance = mongoose.model("LeaveBalance");

    // Clean up attendance records
    const deletedAttendance = await Attendance.deleteMany({
      emp_id: employeeId,
    });
    console.log(
      `Deleted ${deletedAttendance.deletedCount} attendance records for employee ${employeeId}`
    );

    // Clean up leave requests
    const deletedLeaveRequests = await LeaveRequest.deleteMany({
      emp_id: employeeId,
    });
    console.log(
      `Deleted ${deletedLeaveRequests.deletedCount} leave requests for employee ${employeeId}`
    );

    // Clean up leave balances
    const deletedLeaveBalances = await LeaveBalance.deleteMany({
      emp_id: employeeId,
    });
    console.log(
      `Deleted ${deletedLeaveBalances.deletedCount} leave balances for employee ${employeeId}`
    );

    // Update any employees who have this employee as reporting manager
    const Employee = mongoose.model("Employee");
    const updatedSubordinates = await Employee.updateMany(
      { reporting_manager_id: employeeId },
      { $unset: { reporting_manager_id: 1 } }
    );
    console.log(
      `Updated ${updatedSubordinates.modifiedCount} subordinate employees`
    );

    console.log(`Completed cleanup for employee: ${employeeId}`);
    next();
  } catch (error) {
    console.error("Error in employee pre-delete hook:", error);
    next(error);
  }
});

// Also handle document-level deleteOne
employeeSchema.pre("deleteOne", { document: true }, async function (next) {
  try {
    const employeeId = this._id;
    console.log(`Document-level cleanup for employee: ${employeeId}`);

    // Import models inside the hook to avoid circular dependency issues
    const Attendance = mongoose.model("Attendance");
    const LeaveRequest = mongoose.model("LeaveRequest");
    const LeaveBalance = mongoose.model("LeaveBalance");

    // Clean up attendance records
    const deletedAttendance = await Attendance.deleteMany({
      emp_id: employeeId,
    });
    console.log(
      `Deleted ${deletedAttendance.deletedCount} attendance records for employee ${employeeId}`
    );

    // Clean up leave requests
    const deletedLeaveRequests = await LeaveRequest.deleteMany({
      emp_id: employeeId,
    });
    console.log(
      `Deleted ${deletedLeaveRequests.deletedCount} leave requests for employee ${employeeId}`
    );

    // Clean up leave balances
    const deletedLeaveBalances = await LeaveBalance.deleteMany({
      emp_id: employeeId,
    });
    console.log(
      `Deleted ${deletedLeaveBalances.deletedCount} leave balances for employee ${employeeId}`
    );

    // Update any employees who have this employee as reporting manager
    const Employee = mongoose.model("Employee");
    const updatedSubordinates = await Employee.updateMany(
      { reporting_manager_id: employeeId },
      { $unset: { reporting_manager_id: 1 } }
    );
    console.log(
      `Updated ${updatedSubordinates.modifiedCount} subordinate employees`
    );

    console.log(`Completed document-level cleanup for employee: ${employeeId}`);
    next();
  } catch (error) {
    console.error("Error in employee document pre-delete hook:", error);
    next(error);
  }
});

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
