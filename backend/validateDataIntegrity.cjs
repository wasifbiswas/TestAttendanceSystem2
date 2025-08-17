const mongoose = require("mongoose");
const User = require("./src/models/User.js").default;
const Employee = require("./src/models/Employee.js").default;
const UserRole = require("./src/models/UserRole.js").default;
const Role = require("./src/models/Role.js").default;
const Department = require("./src/models/Department.js").default;
const Attendance = require("./src/models/Attendance.js").default;
const LeaveRequest = require("./src/models/LeaveRequest.js").default;
const LeaveBalance = require("./src/models/LeaveBalance.js").default;
const Notification = require("./src/models/Notification.js").default;

const DATABASE_URL =
  "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system";

async function validateDataIntegrity() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(DATABASE_URL);
    console.log("Connected to MongoDB");

    const issues = [];

    console.log("\n📊 Starting data integrity validation...\n");

    // 1. Check for orphaned UserRole records (roles assigned to deleted users)
    console.log("🔍 Checking for orphaned user roles...");
    const userRoles = await UserRole.find({});
    let orphanedUserRoles = 0;

    for (const userRole of userRoles) {
      const userExists = await User.findById(userRole.user_id);
      const roleExists = await Role.findById(userRole.role_id);

      if (!userExists) {
        orphanedUserRoles++;
        issues.push({
          type: "ORPHANED_USER_ROLE",
          message: `UserRole ${userRole._id} references deleted user ${userRole.user_id}`,
          data: userRole,
        });
      }

      if (!roleExists) {
        issues.push({
          type: "ORPHANED_ROLE_REFERENCE",
          message: `UserRole ${userRole._id} references deleted role ${userRole.role_id}`,
          data: userRole,
        });
      }
    }
    console.log(`   Found ${orphanedUserRoles} orphaned user role assignments`);

    // 2. Check for orphaned Employee records (employees without valid users)
    console.log("🔍 Checking for orphaned employee records...");
    const employees = await Employee.find({});
    let orphanedEmployees = 0;

    for (const employee of employees) {
      const userExists = await User.findById(employee.user_id);
      const deptExists = await Department.findById(employee.dept_id);

      if (!userExists) {
        orphanedEmployees++;
        issues.push({
          type: "ORPHANED_EMPLOYEE",
          message: `Employee ${employee._id} (${employee.employee_code}) references deleted user ${employee.user_id}`,
          data: employee,
        });
      }

      if (!deptExists) {
        issues.push({
          type: "ORPHANED_DEPARTMENT_REFERENCE",
          message: `Employee ${employee._id} (${employee.employee_code}) references deleted department ${employee.dept_id}`,
          data: employee,
        });
      }
    }
    console.log(`   Found ${orphanedEmployees} orphaned employee records`);

    // 3. Check for orphaned Attendance records
    console.log("🔍 Checking for orphaned attendance records...");
    const attendanceRecords = await Attendance.find({});
    let orphanedAttendance = 0;

    for (const attendance of attendanceRecords) {
      const employeeExists = await Employee.findById(attendance.emp_id);
      if (!employeeExists) {
        orphanedAttendance++;
        issues.push({
          type: "ORPHANED_ATTENDANCE",
          message: `Attendance ${attendance._id} references deleted employee ${attendance.emp_id}`,
          data: attendance,
        });
      }
    }
    console.log(`   Found ${orphanedAttendance} orphaned attendance records`);

    // 4. Check for orphaned Leave Requests
    console.log("🔍 Checking for orphaned leave requests...");
    const leaveRequests = await LeaveRequest.find({});
    let orphanedLeaveRequests = 0;

    for (const leaveRequest of leaveRequests) {
      const employeeExists = await Employee.findById(leaveRequest.emp_id);
      if (!employeeExists) {
        orphanedLeaveRequests++;
        issues.push({
          type: "ORPHANED_LEAVE_REQUEST",
          message: `Leave Request ${leaveRequest._id} references deleted employee ${leaveRequest.emp_id}`,
          data: leaveRequest,
        });
      }
    }
    console.log(`   Found ${orphanedLeaveRequests} orphaned leave requests`);

    // 5. Check for orphaned Leave Balances
    console.log("🔍 Checking for orphaned leave balances...");
    const leaveBalances = await LeaveBalance.find({});
    let orphanedLeaveBalances = 0;

    for (const leaveBalance of leaveBalances) {
      const employeeExists = await Employee.findById(leaveBalance.emp_id);
      if (!employeeExists) {
        orphanedLeaveBalances++;
        issues.push({
          type: "ORPHANED_LEAVE_BALANCE",
          message: `Leave Balance ${leaveBalance._id} references deleted employee ${leaveBalance.emp_id}`,
          data: leaveBalance,
        });
      }
    }
    console.log(`   Found ${orphanedLeaveBalances} orphaned leave balances`);

    // 6. Check for orphaned notification recipients
    console.log("🔍 Checking for orphaned notification recipients...");
    const notifications = await Notification.find({});
    let notificationsWithOrphanedRecipients = 0;

    for (const notification of notifications) {
      let hasOrphanedRecipients = false;
      for (const recipient of notification.recipients) {
        const userExists = await User.findById(recipient.user_id);
        if (!userExists) {
          hasOrphanedRecipients = true;
          issues.push({
            type: "ORPHANED_NOTIFICATION_RECIPIENT",
            message: `Notification ${notification._id} has recipient referencing deleted user ${recipient.user_id}`,
            data: {
              notificationId: notification._id,
              recipientUserId: recipient.user_id,
            },
          });
        }
      }
      if (hasOrphanedRecipients) {
        notificationsWithOrphanedRecipients++;
      }
    }
    console.log(
      `   Found ${notificationsWithOrphanedRecipients} notifications with orphaned recipients`
    );

    // Summary
    console.log("\n📋 VALIDATION SUMMARY");
    console.log("========================");
    console.log(`Total issues found: ${issues.length}`);

    if (issues.length === 0) {
      console.log("✅ No data integrity issues found!");
    } else {
      console.log("\n🚨 Issues found:");
      console.log(`   - Orphaned user roles: ${orphanedUserRoles}`);
      console.log(`   - Orphaned employees: ${orphanedEmployees}`);
      console.log(`   - Orphaned attendance records: ${orphanedAttendance}`);
      console.log(`   - Orphaned leave requests: ${orphanedLeaveRequests}`);
      console.log(`   - Orphaned leave balances: ${orphanedLeaveBalances}`);
      console.log(
        `   - Notifications with orphaned recipients: ${notificationsWithOrphanedRecipients}`
      );

      console.log(
        "\n💡 All these issues will now be automatically prevented by the cascade delete hooks implemented in the User and Employee models."
      );
      console.log(
        "\n🔧 To clean up existing orphaned data, you can run the appropriate cleanup scripts."
      );
    }

    // Detailed issues (for debugging)
    if (issues.length > 0 && process.argv.includes("--detailed")) {
      console.log("\n🔍 DETAILED ISSUES:");
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.type}] ${issue.message}`);
      });
    }

    console.log("\n✅ Data integrity validation completed");
  } catch (error) {
    console.error("❌ Error during validation:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  }
}

// Run the validation
validateDataIntegrity();
