import dotenv from "dotenv";
import colors from "colors";
import mongoose from "mongoose";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import LeaveBalance from "../src/models/LeaveBalance.js";
import LeaveType from "../src/models/LeaveType.js";
import Employee from "../src/models/Employee.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

const fixLeaveBalances = async () => {
  try {
    // Connect to MongoDB using environment configuration
    console.log("\nConnecting to MongoDB...".cyan);
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`.cyan);

    // Fetch all models to ensure they're registered
    const LeaveTypeModel = mongoose.model('LeaveType', LeaveType.schema);
    const EmployeeModel = mongoose.model('Employee', Employee.schema);

    // Fetch and fix leave balances
    console.log("\nFetching all leave balances...".yellow);
    const balances = await LeaveBalance.find({}).populate('leave_type_id').populate('emp_id');
    console.log(`Found ${balances.length} leave balance records`.cyan);

    let fixedCount = 0;
    for (const balance of balances) {
      let needsUpdate = false;
      const original = { ...balance.toObject() };

      // Fix negative values
      if (balance.used_leaves < 0) {
        balance.used_leaves = 0;
        needsUpdate = true;
      }
      if (balance.pending_leaves < 0) {
        balance.pending_leaves = 0;
        needsUpdate = true;
      }
      if (balance.carried_forward < 0) {
        balance.carried_forward = 0;
        needsUpdate = true;
      }

      // Fix over-allocation
      const totalAllocation = balance.allocated_leaves + balance.carried_forward;
      if (balance.used_leaves > totalAllocation) {
        balance.used_leaves = totalAllocation;
        needsUpdate = true;
      }

      const availableForPending = totalAllocation - balance.used_leaves;
      if (balance.pending_leaves > availableForPending) {
        balance.pending_leaves = availableForPending;
        needsUpdate = true;
      }

      if (needsUpdate) {
        try {
          await balance.save();
          fixedCount++;
          
          const leaveName = balance.leave_type_id ? balance.leave_type_id.leave_name : 'Unknown';
          const empId = balance.emp_id ? balance.emp_id._id : 'Unknown';
          
          console.log(
            `\nFixed leave balance for employee ${empId} - ${leaveName}:`.green
          );
          console.log("Before:".yellow, {
            used: original.used_leaves,
            pending: original.pending_leaves,
            carried: original.carried_forward,
            allocated: original.allocated_leaves,
            total: original.allocated_leaves + original.carried_forward
          });
          console.log("After:".green, {
            used: balance.used_leaves,
            pending: balance.pending_leaves,
            carried: balance.carried_forward,
            allocated: balance.allocated_leaves,
            total: balance.allocated_leaves + balance.carried_forward
          });
        } catch (saveError) {
          console.error(`Error saving balance:`.red, saveError.message);
        }
      }
    }

    console.log(`\nFixed ${fixedCount} leave balance records`.green);
    console.log("Data fix completed successfully".green);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error fixing leave balances:".red, error);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the fix
fixLeaveBalances();