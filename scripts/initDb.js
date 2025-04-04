import dotenv from "dotenv";
import mongoose from "mongoose";
import colors from "colors";
import connectDB from "../src/config/database.js";
import Role from "../src/models/Role.js";
import User from "../src/models/User.js";
import UserRole from "../src/models/UserRole.js";

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const roles = [
  {
    role_name: "ADMIN",
    description: "Administrator with full access",
  },
  {
    role_name: "MANAGER",
    description: "Department manager with limited admin access",
  },
  {
    role_name: "EMPLOYEE",
    description: "Regular employee with basic access",
  },
];

const initializeDb = async () => {
  try {
    // Clear existing roles
    await Role.deleteMany({});
    console.log("Deleted existing roles".red);

    // Create new roles
    const createdRoles = await Role.insertMany(roles);
    console.log(`Created ${createdRoles.length} roles`.green);

    // Find existing user to make admin
    const user = await User.findOne({ username: "testadmin2" });

    if (user) {
      // Find admin role
      const adminRole = await Role.findOne({ role_name: "ADMIN" });

      if (adminRole) {
        // Check if user already has the role
        const existingUserRole = await UserRole.findOne({
          user_id: user._id,
          role_id: adminRole._id,
        });

        if (!existingUserRole) {
          // Assign admin role to the user
          await UserRole.create({
            user_id: user._id,
            role_id: adminRole._id,
          });
          console.log(`Assigned ADMIN role to user: ${user.username}`.green);
        } else {
          console.log(`User ${user.username} already has ADMIN role`.yellow);
        }
      }
    } else {
      console.log("No user found to assign admin role".yellow);
    }

    console.log("Database initialization completed".green);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`.red);
    process.exit(1);
  }
};

initializeDb();
