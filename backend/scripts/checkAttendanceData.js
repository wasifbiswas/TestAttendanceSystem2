import mongoose from 'mongoose';
import Attendance from '../src/models/Attendance.js';
import Employee from '../src/models/Employee.js';
import User from '../src/models/User.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/attendance_system');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const checkAllData = async () => {
  await connectDB();

  // Check all collections
  console.log('=== CHECKING ALL COLLECTIONS ===');
  
  // Get all users
  const users = await User.find().select('_id email full_name');
  console.log(`\nFound ${users.length} users:`);
  users.forEach(user => {
    console.log(`  User ID: ${user._id}, Email: ${user.email}, Name: ${user.full_name}`);
  });

  // Get all employees
  const employees = await Employee.find().select('_id employee_code user_id');
  console.log(`\nFound ${employees.length} employees:`);
  employees.forEach(employee => {
    console.log(`  Employee ID: ${employee._id}, Code: ${employee.employee_code}, User ID: ${employee.user_id}`);
  });

  // Get all attendance records
  const allAttendance = await Attendance.find().sort({ attendance_date: -1 });
  console.log(`\nFound ${allAttendance.length} total attendance records:`);
  if (allAttendance.length > 0) {
    allAttendance.slice(0, 20).forEach(record => {
      console.log(`  Employee ID: ${record.emp_id}, Date: ${record.attendance_date.toISOString().split('T')[0]}, Status: ${record.status}`);
    });
    if (allAttendance.length > 20) {
      console.log(`  ... and ${allAttendance.length - 20} more records`);
    }
  }

  // Check for July 2025 specifically
  const july2025Start = new Date(2025, 6, 1); // July 1, 2025
  const july2025End = new Date(2025, 6, 31, 23, 59, 59, 999); // July 31, 2025
  
  const julyAttendance = await Attendance.find({
    attendance_date: { 
      $gte: july2025Start,
      $lte: july2025End
    }
  });
  
  console.log(`\n=== JULY 2025 ATTENDANCE DATA ===`);
  console.log(`Found ${julyAttendance.length} attendance records for July 2025:`);
  julyAttendance.forEach(record => {
    console.log(`  Employee ID: ${record.emp_id}, Date: ${record.attendance_date.toISOString().split('T')[0]}, Status: ${record.status}`);
  });

  // Check for any attendance records with LEAVE status
  const leaveRecords = await Attendance.find({ status: 'LEAVE' });
  console.log(`\n=== LEAVE RECORDS ===`);
  console.log(`Found ${leaveRecords.length} leave records:`);
  leaveRecords.forEach(record => {
    console.log(`  Employee ID: ${record.emp_id}, Date: ${record.attendance_date.toISOString().split('T')[0]}, Status: ${record.status}`);
  });

  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
};

checkAllData().catch(console.error);
