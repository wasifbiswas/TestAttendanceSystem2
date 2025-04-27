import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserRole from "../models/UserRole.js";

// Load environment variables
dotenv.config();

async function checkUserRoles() {
  try {
    // Connect directly to the MongoDB cluster
    const MONGO_URI =
      "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system";
    console.log(`Connecting to MongoDB with URI: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Get username from command line
    const username = process.argv[2];

    if (!username) {
      console.error("Please provide a username");
      console.log("Usage: node src/utils/checkUserRole.js <username>");
      process.exit(1);
    }

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`User with username ${username} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.username} (${user._id})`);

    // Get all roles from the database
    const allRoles = await Role.find({});
    console.log("\nAvailable roles in the system:");
    allRoles.forEach((role) => {
      console.log(
        `- ${role.role_name} (${role._id}) - ${
          role.description || "No description"
        }`
      );
    });

    // Get user roles
    const userRoles = await UserRole.find({ user_id: user._id }).populate(
      "role_id"
    );

    if (userRoles.length === 0) {
      console.log(`\nUser ${username} has no roles assigned`);
    } else {
      console.log(`\nRoles for user ${username}:`);
      userRoles.forEach((userRole) => {
        if (userRole.role_id) {
          console.log(
            `- ${userRole.role_id.role_name} (${userRole.role_id._id})`
          );
          console.log(`  Assigned on: ${userRole.assigned_date}`);
        } else {
          console.log(
            `- Invalid role reference (role_id: ${userRole.role_id})`
          );
        }
      });
    }

    // Check if user has ADMIN role
    const adminRole = allRoles.find((role) => role.role_name === "ADMIN");
    if (!adminRole) {
      console.log("\nWARNING: No ADMIN role found in the system!");
    } else {
      const isAdmin = userRoles.some(
        (userRole) =>
          userRole.role_id &&
          userRole.role_id._id.toString() === adminRole._id.toString()
      );

      if (isAdmin) {
        console.log(`\n✅ User ${username} IS an admin`);
      } else {
        console.log(`\n❌ User ${username} is NOT an admin`);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the function
checkUserRoles();
