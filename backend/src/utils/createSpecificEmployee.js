import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import colors from "colors";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

// Load environment variables from root directory
dotenv.config({ path: path.join(rootDir, ".env") });

// Connect to the database
const connectDB = async () => {
  try {
    // Use the MongoDB Atlas URI directly to ensure we're connecting to the right database
    const mongoURI =
      "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system";
    console.log("Connecting to MongoDB with URI:", mongoURI);

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`.green);
    return true;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`.red);
    process.exit(1);
  }
};

const createEmployeeForSpecificUser = async () => {
  try {
    await connectDB();

    // Get all users to debug
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users in the database`.blue);

    if (allUsers.length === 0) {
      console.log(
        "No users found in the database. Please create a user first.".red
      );
      process.exit(1);
    }

    console.log("Available users:".cyan);
    allUsers.forEach((user) => {
      console.log(`- ID: ${user._id}, Username: ${user.username}`.cyan);
    });

    // Find the user with ID 680e7be7938ab5e34bfe157f or use the first user
    let user = allUsers.find(
      (u) => u._id.toString() === "680e7be7938ab5e34bfe157f"
    );
    if (!user) {
      user = allUsers[0];
      console.log(
        `Could not find user with ID 680e7be7938ab5e34bfe157f, using ${user.username} instead`
          .yellow
      );
    } else {
      console.log(
        `Found user with ID 680e7be7938ab5e34bfe157f: ${user.username}`.green
      );
    }

    console.log(`Selected user: ${user.username} with ID ${user._id}`.yellow);

    // Check if user already has an employee profile
    const existingEmployee = await Employee.findOne({ user_id: user._id });

    if (existingEmployee) {
      console.log(
        `User ${user.username} already has an employee profile (ID: ${existingEmployee._id})`
          .yellow
      );

      // Let's create employee profiles for ALL users to be sure
      for (const otherUser of allUsers) {
        if (otherUser._id.toString() === user._id.toString()) continue; // Skip the one we already checked

        const otherExistingEmployee = await Employee.findOne({
          user_id: otherUser._id,
        });
        if (!otherExistingEmployee) {
          // Create department if needed
          let department = await Department.findOne({});
          if (!department) {
            console.log(
              "No departments found, creating default department".blue
            );
            department = await Department.create({
              dept_name: "General",
              description: "General Department",
              is_active: true,
            });
            console.log("Created default department".green);
          }

          // Create employee profile
          const employeeCode = `EMP${String(
            Math.floor(1000 + Math.random() * 9000)
          )}`;
          const newEmployee = await Employee.create({
            user_id: otherUser._id,
            dept_id: department._id,
            designation: "Employee",
            hire_date: otherUser.join_date || new Date(),
            employee_code: employeeCode,
          });

          console.log(
            `Created employee profile for user: ${otherUser.username} with code: ${employeeCode}`
              .green
          );
          console.log(`Employee ID: ${newEmployee._id}`.green);
        } else {
          console.log(
            `User ${otherUser.username} already has an employee profile (ID: ${otherExistingEmployee._id})`
              .yellow
          );
        }
      }

      process.exit(0);
    }

    // Get department (create one if needed)
    let department = await Department.findOne({});

    if (!department) {
      console.log("No departments found, creating default department".blue);
      department = await Department.create({
        dept_name: "General",
        description: "General Department",
        is_active: true,
      });
      console.log("Created default department".green);
    }

    // Create employee profile
    const employeeCode = `EMP${String(
      Math.floor(1000 + Math.random() * 9000)
    )}`;

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
    console.log(`Employee ID: ${employee._id}`.green);

    // Let's create employee profiles for ALL users to be sure
    for (const otherUser of allUsers) {
      if (otherUser._id.toString() === user._id.toString()) continue; // Skip the one we just created

      const otherExistingEmployee = await Employee.findOne({
        user_id: otherUser._id,
      });
      if (!otherExistingEmployee) {
        // Create employee profile
        const otherEmployeeCode = `EMP${String(
          Math.floor(1000 + Math.random() * 9000)
        )}`;
        const newEmployee = await Employee.create({
          user_id: otherUser._id,
          dept_id: department._id,
          designation: "Employee",
          hire_date: otherUser.join_date || new Date(),
          employee_code: otherEmployeeCode,
        });

        console.log(
          `Created employee profile for user: ${otherUser.username} with code: ${otherEmployeeCode}`
            .green
        );
        console.log(`Employee ID: ${newEmployee._id}`.green);
      } else {
        console.log(
          `User ${otherUser.username} already has an employee profile (ID: ${otherExistingEmployee._id})`
            .yellow
        );
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`.red);
    console.error(error.stack);
    process.exit(1);
  }
};

createEmployeeForSpecificUser();
