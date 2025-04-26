import dotenv from "dotenv";
import mongoose from "mongoose";
import colors from "colors";
import Role from "../src/models/Role.js";
import User from "../src/models/User.js";
import UserRole from "../src/models/UserRole.js";

// Load environment variables
dotenv.config();

// Connect to the database directly
const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    // Use hardcoded URI if environment variable is not available
    const uri =
      process.env.MONGO_URI ||
      "mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system";
    console.log(`MONGO_URI: ${uri}`);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`.green);
    return true;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`.red);
    return false;
  }
};

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
    const connected = await connectDB();
    if (!connected) {
      throw new Error("Failed to connect to MongoDB");
    }

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
