const mongoose = require('mongoose');
const User = require('./src/models/User.js').default;
const Employee = require('./src/models/Employee.js').default;
const UserRole = require('./src/models/UserRole.js').default;
const Role = require('./src/models/Role.js').default;
const Department = require('./src/models/Department.js').default;
const Attendance = require('./src/models/Attendance.js').default;
const LeaveRequest = require('./src/models/LeaveRequest.js').default;
const LeaveBalance = require('./src/models/LeaveBalance.js').default;
const Notification = require('./src/models/Notification.js').default;

const DATABASE_URL = 'mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system';

async function cleanupAllOrphanedData() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to MongoDB');

    let totalCleaned = 0;

    console.log('\n🧹 Starting comprehensive cleanup of all orphaned data...\n');

    // 1. Clean up orphaned UserRole records
    console.log('🔍 Cleaning orphaned user roles...');
    const userRoles = await UserRole.find({});
    let cleanedUserRoles = 0;
    
    for (const userRole of userRoles) {
      const userExists = await User.findById(userRole.user_id);
      const roleExists = await Role.findById(userRole.role_id);
      
      if (!userExists || !roleExists) {
        await UserRole.deleteOne({ _id: userRole._id });
        cleanedUserRoles++;
        console.log(`   ❌ Removed UserRole ${userRole._id} (user: ${userExists ? '✓' : '✗'}, role: ${roleExists ? '✓' : '✗'})`);
      }
    }
    console.log(`   ✅ Cleaned ${cleanedUserRoles} orphaned user role assignments`);
    totalCleaned += cleanedUserRoles;

    // 2. Clean up orphaned Employee records
    console.log('\n🔍 Cleaning orphaned employee records...');
    const employees = await Employee.find({});
    let cleanedEmployees = 0;
    
    for (const employee of employees) {
      const userExists = await User.findById(employee.user_id);
      const deptExists = await Department.findById(employee.dept_id);
      
      if (!userExists) {
        await Employee.deleteOne({ _id: employee._id });
        cleanedEmployees++;
        console.log(`   ❌ Removed Employee ${employee._id} (${employee.employee_code}) - user deleted`);
      } else if (!deptExists) {
        console.log(`   ⚠️  Employee ${employee._id} (${employee.employee_code}) references deleted department ${employee.dept_id}`);
        // Note: We don't delete the employee, just flag the issue
      }
    }
    console.log(`   ✅ Cleaned ${cleanedEmployees} orphaned employee records`);
    totalCleaned += cleanedEmployees;

    // 3. Clean up orphaned Attendance records
    console.log('\n🔍 Cleaning orphaned attendance records...');
    const attendanceRecords = await Attendance.find({});
    let cleanedAttendance = 0;
    
    for (const attendance of attendanceRecords) {
      const employeeExists = await Employee.findById(attendance.emp_id);
      if (!employeeExists) {
        await Attendance.deleteOne({ _id: attendance._id });
        cleanedAttendance++;
        console.log(`   ❌ Removed Attendance ${attendance._id} - employee ${attendance.emp_id} deleted`);
      }
    }
    console.log(`   ✅ Cleaned ${cleanedAttendance} orphaned attendance records`);
    totalCleaned += cleanedAttendance;

    // 4. Clean up orphaned Leave Requests
    console.log('\n🔍 Cleaning orphaned leave requests...');
    const leaveRequests = await LeaveRequest.find({});
    let cleanedLeaveRequests = 0;
    
    for (const leaveRequest of leaveRequests) {
      const employeeExists = await Employee.findById(leaveRequest.emp_id);
      if (!employeeExists) {
        await LeaveRequest.deleteOne({ _id: leaveRequest._id });
        cleanedLeaveRequests++;
        console.log(`   ❌ Removed Leave Request ${leaveRequest._id} - employee ${leaveRequest.emp_id} deleted`);
      }
    }
    console.log(`   ✅ Cleaned ${cleanedLeaveRequests} orphaned leave requests`);
    totalCleaned += cleanedLeaveRequests;

    // 5. Clean up orphaned Leave Balances
    console.log('\n🔍 Cleaning orphaned leave balances...');
    const leaveBalances = await LeaveBalance.find({});
    let cleanedLeaveBalances = 0;
    
    for (const leaveBalance of leaveBalances) {
      const employeeExists = await Employee.findById(leaveBalance.emp_id);
      if (!employeeExists) {
        await LeaveBalance.deleteOne({ _id: leaveBalance._id });
        cleanedLeaveBalances++;
        console.log(`   ❌ Removed Leave Balance ${leaveBalance._id} - employee ${leaveBalance.emp_id} deleted`);
      }
    }
    console.log(`   ✅ Cleaned ${cleanedLeaveBalances} orphaned leave balances`);
    totalCleaned += cleanedLeaveBalances;

    // 6. Clean up orphaned notification recipients
    console.log('\n🔍 Cleaning orphaned notification recipients...');
    const notifications = await Notification.find({});
    let cleanedNotifications = 0;
    let totalRecipientsRemoved = 0;
    
    for (const notification of notifications) {
      let originalRecipientCount = notification.recipients.length;
      let hasChanges = false;
      
      // Filter out orphaned recipients
      const validRecipients = [];
      for (const recipient of notification.recipients) {
        const userExists = await User.findById(recipient.user_id);
        if (userExists) {
          validRecipients.push(recipient);
        } else {
          totalRecipientsRemoved++;
          hasChanges = true;
          console.log(`   ❌ Removed recipient ${recipient.user_id} from notification ${notification._id}`);
        }
      }
      
      if (hasChanges) {
        if (validRecipients.length === 0) {
          // No valid recipients left, delete the notification
          await Notification.deleteOne({ _id: notification._id });
          console.log(`   🗑️  Deleted notification ${notification._id} - no valid recipients left`);
        } else {
          // Update notification with valid recipients
          notification.recipients = validRecipients;
          await notification.save();
          console.log(`   🔄 Updated notification ${notification._id} - removed ${originalRecipientCount - validRecipients.length} orphaned recipients`);
        }
        cleanedNotifications++;
      }
    }
    console.log(`   ✅ Cleaned ${cleanedNotifications} notifications, removed ${totalRecipientsRemoved} orphaned recipients`);
    totalCleaned += totalRecipientsRemoved;

    // Summary
    console.log('\n🎉 CLEANUP COMPLETED');
    console.log('====================');
    console.log(`Total orphaned records cleaned: ${totalCleaned}`);
    console.log(`   - User roles: ${cleanedUserRoles}`);
    console.log(`   - Employees: ${cleanedEmployees}`);
    console.log(`   - Attendance records: ${cleanedAttendance}`);
    console.log(`   - Leave requests: ${cleanedLeaveRequests}`);
    console.log(`   - Leave balances: ${cleanedLeaveBalances}`);
    console.log(`   - Notification recipients: ${totalRecipientsRemoved}`);
    
    console.log('\n💡 Future Prevention:');
    console.log('   ✅ Cascade delete hooks implemented in User and Employee models');
    console.log('   ✅ All future deletions will automatically clean up related data');
    console.log('   ✅ No more orphaned records should occur');
    
    if (totalCleaned > 0) {
      console.log('\n🔍 Recommendation: Run the validation script again to verify all issues are resolved.');
    } else {
      console.log('\n✅ Database is now clean and consistent!');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the cleanup
cleanupAllOrphanedData();
