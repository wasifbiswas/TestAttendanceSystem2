const mongoose = require('mongoose');

require('./src/models/User');
require('./src/models/Employee');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system';

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User');
    const Employee = mongoose.model('Employee');
    
    // Get all users
    const users = await User.find({}).limit(3);
    console.log(`\n👤 Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, ID: ${user._id}`);
    });
    
    // Get all employees
    const employees = await Employee.find({}).limit(3);
    console.log(`\n👥 Found ${employees.length} employees:`);
    
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. User ID: ${emp.user_id}, Employee ID: ${emp._id}, Name: ${emp.first_name} ${emp.last_name}`);
    });
    
    // Check if any user-employee relationships exist
    if (users.length > 0 && employees.length > 0) {
      const user = users[0];
      const employee = employees.find(emp => emp.user_id?.toString() === user._id.toString());
      
      if (employee) {
        console.log(`\n🔗 Found relationship: User ${user.email} -> Employee ${employee.first_name} ${employee.last_name}`);
        console.log(`User ID: ${user._id}`);
        console.log(`Employee ID: ${employee._id}`);
        
        // This is the data our fixed attendance summary should return for this user
        console.log('\n📋 For testing: This employee should show 0 attendance in current month (July 2025)');
      } else {
        console.log('\n❌ No user-employee relationship found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUsers();
