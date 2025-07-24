const mongoose = require('mongoose');
const path = require('path');

// Set up the models path
require('./src/models/User');
require('./src/models/Employee');
require('./src/models/Attendance');

// Connect to the database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system';

async function testMonthlyAttendanceCalculation() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Attendance = mongoose.model('Attendance');
    const Employee = mongoose.model('Employee');
    
    // Get current date info
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Create month boundaries - this is what our fixed code should use
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    console.log('=== Testing Monthly Attendance Calculation ===');
    console.log(`Current Date: ${currentDate.toISOString()}`);
    console.log(`Month Start: ${startOfMonth.toISOString()}`);
    console.log(`Month End: ${endOfMonth.toISOString()}`);
    console.log('');

    // Find a user with attendance data
    const attendanceRecords = await Attendance.find({}).limit(5);
    console.log('Sample attendance records:');
    attendanceRecords.forEach(record => {
      console.log(`- Employee: ${record.employeeId}, Date: ${record.date}, Status: ${record.status}`);
    });
    
    if (attendanceRecords.length > 0) {
      const testEmployeeId = attendanceRecords[0].employeeId;
      console.log(`\nTesting with employee: ${testEmployeeId}`);
      
      // Test monthly calculation (what our fix should do)
      const monthlyAttendance = await Attendance.aggregate([
        {
          $match: {
            employeeId: testEmployeeId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log('\n=== MONTHLY Attendance (Current Month Only) ===');
      console.log('Monthly stats:', monthlyAttendance);
      
      // Compare with yearly calculation (the bug we fixed)
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      
      const yearlyAttendance = await Attendance.aggregate([
        {
          $match: {
            employeeId: testEmployeeId,
            date: { $gte: startOfYear, $lte: endOfYear }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log('\n=== YEARLY Attendance (Full Year - The Bug) ===');
      console.log('Yearly stats:', yearlyAttendance);
      
      // Show all attendance records for this employee
      const allAttendance = await Attendance.find({ employeeId: testEmployeeId })
        .sort({ date: -1 });
      
      console.log(`\n=== All Attendance Records for Employee ${testEmployeeId} ===`);
      allAttendance.forEach(record => {
        const isThisMonth = record.date >= startOfMonth && record.date <= endOfMonth;
        console.log(`${record.date.toISOString().split('T')[0]} - ${record.status} ${isThisMonth ? '(THIS MONTH)' : '(OTHER MONTH)'}`);
      });
      
      // Summary
      const monthlyCount = monthlyAttendance.reduce((sum, item) => sum + item.count, 0);
      const yearlyCount = yearlyAttendance.reduce((sum, item) => sum + item.count, 0);
      
      console.log('\n=== SUMMARY ===');
      console.log(`Monthly attendance count: ${monthlyCount}`);
      console.log(`Yearly attendance count: ${yearlyCount}`);
      console.log(`Difference (bug impact): ${yearlyCount - monthlyCount} extra records`);
      
      if (monthlyCount === 0) {
        console.log('\n✅ SUCCESS: No attendance records found for current month - dashboard should show 0');
      } else {
        console.log(`\n📊 Monthly breakdown should show: ${JSON.stringify(monthlyAttendance)}`);
      }
    }
    
  } catch (error) {
    console.error('Error testing attendance calculation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testMonthlyAttendanceCalculation();
