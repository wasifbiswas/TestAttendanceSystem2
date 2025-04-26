import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import bcrypt from "bcryptjs";
import connectDB from "../config/database.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserRole from "../models/UserRole.js";

// Load environment variables
dotenv.config();

// Connect to the database
await connectDB();

const initializeTestUsers = async () => {
  try {
    // Clear existing test users
    await User.deleteMany({ username: { $in: ['testadmin2', 'testmanager', 'testemployee'] } });
    console.log("Cleared existing test users...".yellow);

    // Get role IDs
    const adminRole = await Role.findOne({ role_name: "ADMIN" });
    const managerRole = await Role.findOne({ role_name: "MANAGER" });
    const employeeRole = await Role.findOne({ role_name: "EMPLOYEE" });

    if (!adminRole || !managerRole || !employeeRole) {
      throw new Error("Required roles not found. Please run RoleSeed.js first.");
    }

    // Create test users
    const testUsers = [
      {
        username: "testadmin2",
        password: "Password123",
        email: "testadmin2@example.com",
        full_name: "Test Admin",
        roles: [adminRole._id]
      },
      {
        username: "testmanager",
        password: "Password123",
        email: "testmanager@example.com",
        full_name: "Test Manager",
        roles: [managerRole._id]
      },
      {
        username: "testemployee",
        password: "Password123",
        email: "testemployee@example.com",
        full_name: "Test Employee",
        roles: [employeeRole._id]
      }
    ];

    for (const userData of testUsers) {
      const { username, password, email, full_name, roles } = userData;

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        username,
        password_hash: hashedPassword,
        email,
        full_name
      });

      // Assign roles
      for (const roleId of roles) {
        await UserRole.create({
          user_id: user._id,
          role_id: roleId
        });
      }

      console.log(`Created user: ${username} with roles: ${roles.join(", ")}`.green);
    }

    console.log("\nTest users initialized successfully!".cyan);
    process.exit(0);
  } catch (error) {
    console.error("Error initializing test users:".red, error);
    process.exit(1);
  }
};

// Run initialization
initializeTestUsers();