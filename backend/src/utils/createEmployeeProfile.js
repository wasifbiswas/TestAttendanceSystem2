import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import colors from "colors";

// Load environment variables
dotenv.config();

// Connect to the database
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://localhost:27017/attendance_system";
    console.log("Connecting to MongoDB with URI:", mongoURI);

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`.green);
    return true;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`.red);
    process.exit(1);
  }
};

const createEmployeeProfile = async () => {
  try {
    await connectDB();

    // Get all users without employee profiles
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database`);

    // Get department (create one if needed)
    let department = await Department.findOne({});

    if (!department) {
      console.log("No departments found, creating default department");
      department = await Department.create({
        dept_name: "General",
        description: "General Department",
        is_active: true,
      });
      console.log("Created default department");
    }

    // Create employee profiles for users that don't have them
    let count = 0;

    for (const user of users) {
      // Check if user already has an employee profile
      const existingEmployee = await Employee.findOne({ user_id: user._id });

      if (!existingEmployee) {
        const employeeCode = `EMP${String(
          Math.floor(1000 + Math.random() * 9000)
        )}`;

        // Create employee profile
        const employee = await Employee.create({
          user_id: user._id,
          dept_id: department._id,
          designation: "Employee",
          hire_date: user.join_date || new Date(),
          employee_code: employeeCode,
        });

        console.log(
          `Created employee profile for user: ${user.username} with code: ${employeeCode}`
            .green
        );
        count++;
      } else {
        console.log(
          `User ${user.username} already has an employee profile`.yellow
        );
      }
    }

    console.log(`Created ${count} employee profiles`.green);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`.red);
    process.exit(1);
  }
};

createEmployeeProfile();
