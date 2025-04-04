import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/database.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import UserRole from "../models/UserRole.js";

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Function to make a user admin
const makeUserAdmin = async (username) => {
  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`User with username ${username} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.username} (${user._id})`);

    // Find the admin role
    const adminRole = await Role.findOne({ role_name: "ADMIN" });
    if (!adminRole) {
      console.error("Admin role not found in the database");
      process.exit(1);
    }

    console.log(`Found admin role: ${adminRole.role_name} (${adminRole._id})`);

    // Check if user is already admin
    const existingUserRole = await UserRole.findOne({
      user_id: user._id,
      role_id: adminRole._id,
    });

    if (existingUserRole) {
      console.log(`User ${username} is already an admin`);
      process.exit(0);
    }

    // Assign admin role to user
    const userRole = await UserRole.create({
      user_id: user._id,
      role_id: adminRole._id,
      assigned_date: new Date(),
    });

    console.log(`Successfully made ${username} an admin!`);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.error("Please provide a username");
  console.log("Usage: node utils/makeAdmin.js <username>");
  process.exit(1);
}

// Run the function
makeUserAdmin(username);
