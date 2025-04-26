import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from "../src/config/database.js";
import User from "../src/models/User.js";
import Role from "../src/models/Role.js";
import UserRole from "../src/models/UserRole.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const fixUserRole = async () => {
  try {
    console.log("Connecting to MongoDB...".cyan);
    await connectDB();

    // Find testadmin2 user
    const user = await User.findOne({ username: "testadmin2" });
    if (!user) {
      console.error("User testadmin2 not found".red);
      process.exit(1);
    }
    console.log(`Found user: ${user.username} (${user._id})`.green);

    // Find admin role
    const adminRole = await Role.findOne({ role_name: "ADMIN" });
    if (!adminRole) {
      console.error("Admin role not found".red);
      process.exit(1);
    }
    console.log(`Found admin role: ${adminRole.role_name} (${adminRole._id})`.green);

    // Remove any existing roles for the user
    await UserRole.deleteMany({ user_id: user._id });
    console.log("Cleared existing user roles".yellow);

    // Create admin role for user
    const userRole = await UserRole.create({
      user_id: user._id,
      role_id: adminRole._id,
      assigned_date: new Date()
    });

    console.log(`Successfully assigned admin role to ${user.username}`.green);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error}`.red);
    process.exit(1);
  }
};

fixUserRole();