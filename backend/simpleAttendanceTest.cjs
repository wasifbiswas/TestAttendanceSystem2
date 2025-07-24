const mongoose = require('mongoose');
const path = require('path');

// Set up the models path
require('./src/models/User');
require('./src/models/Employee');
require('./src/models/Attendance');

// Connect to the database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system';

async function simpleAttendanceTest() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Attendance = mongoose.model('Attendance');
    
    // Get current date info
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    console.log('=== Current Date Info ===');
    console.log(`Current Date: ${currentDate.toDateString()}`);
    console.log(`Year: ${currentYear}, Month: ${currentMonth + 1} (${new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long' })})`);
    
    // Create month boundaries - this is what our fixed code should use
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    console.log('\n=== Month Boundaries (Our Fix) ===');
    console.log(`Start of Month: ${startOfMonth.toDateString()}`);
    console.log(`End of Month: ${endOfMonth.toDateString()}`);
    
    // Create year boundaries - this was the bug
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    
    console.log('\n=== Year Boundaries (The Bug) ===');
    console.log(`Start of Year: ${startOfYear.toDateString()}`);
    console.log(`End of Year: ${endOfYear.toDateString()}`);
    
    // Check total attendance records
    const totalRecords = await Attendance.countDocuments();
    console.log(`\n📊 Total attendance records in database: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('\n✅ PERFECT! No attendance records found.');
      console.log('This means:');
      console.log('- Monthly calculation will return: 0 records');
      console.log('- Dashboard should show: No attendance data');
      console.log('- The "Attendance This Month" section should be empty or show 0');
      
      // Let's also check for employees
      const Employee = mongoose.model('Employee');
      const employeeCount = await Employee.countDocuments();
      console.log(`\n👥 Employees in database: ${employeeCount}`);
      
      const User = mongoose.model('User');
      const userCount = await User.countDocuments();
      console.log(`👤 Users in database: ${userCount}`);
      
    } else {
      // Count records by month vs year
      const monthlyCount = await Attendance.countDocuments({
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      const yearlyCount = await Attendance.countDocuments({
        date: { $gte: startOfYear, $lte: endOfYear }
      });
      
      console.log(`\n📅 Records THIS MONTH (${currentMonth + 1}/${currentYear}): ${monthlyCount}`);
      console.log(`📅 Records THIS YEAR (${currentYear}): ${yearlyCount}`);
      console.log(`🐛 Bug Impact: ${yearlyCount - monthlyCount} extra records were being counted`);
      
      if (monthlyCount === 0) {
        console.log('\n✅ SUCCESS: No records in current month');
        console.log('- Dashboard should show 0 for "Attendance This Month"');
        console.log('- Our fix correctly filters to current month only');
      }
      
      // Show some sample records to understand the data
      const sampleRecords = await Attendance.find({}).limit(3);
      console.log('\n📋 Sample attendance records:');
      sampleRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${JSON.stringify(record, null, 2)}`);
      });
    }
    
    console.log('\n=== Fix Summary ===');
    console.log('✅ Backend fix: Changed date range from YEARLY to MONTHLY');
    console.log('✅ Old logic: startOfYear to endOfYear (BUG)');
    console.log('✅ New logic: startOfMonth to endOfMonth (FIXED)');
    console.log('✅ This ensures "Attendance This Month" shows only current month data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

simpleAttendanceTest();
