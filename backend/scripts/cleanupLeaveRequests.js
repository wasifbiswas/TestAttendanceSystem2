import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from "../src/config/database.js";
import LeaveRequest from "../src/models/LeaveRequest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const cleanupLeaveRequests = async () => {
  try {
    console.log("Connecting to MongoDB...".cyan);
    await connectDB();

    // Find leave requests with invalid leave types
    const invalidRequests = await LeaveRequest.find({
      $or: [
        { leave_type_id: null },
        { leave_type_id: { $exists: false } }
      ]
    });

    console.log(`Found ${invalidRequests.length} invalid leave requests`.yellow);

    // Delete invalid requests
    if (invalidRequests.length > 0) {
      await LeaveRequest.deleteMany({
        _id: { $in: invalidRequests.map(req => req._id) }
      });
      console.log("Deleted invalid leave requests".green);
    }

    // Verify cleanup
    const remainingInvalid = await LeaveRequest.find({
      $or: [
        { leave_type_id: null },
        { leave_type_id: { $exists: false } }
      ]
    });

    console.log(`Remaining invalid requests: ${remainingInvalid.length}`.cyan);
    console.log("Cleanup completed successfully".green);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

// Run the cleanup
cleanupLeaveRequests();