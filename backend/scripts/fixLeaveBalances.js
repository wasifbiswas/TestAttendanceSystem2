import dotenv from "dotenv";
import colors from "colors";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import LeaveBalance from "../src/models/LeaveBalance.js";
import LeaveType from "../src/models/LeaveType.js";
import Employee from "../src/models/Employee.js";
import LeaveRequest from "../src/models/LeaveRequest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../../.env") });

const fixLeaveBalances = async () => {
  try {
    // Connect to MongoDB using environment configuration
    console.log("\nConnecting to MongoDB...".cyan);
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`.cyan);

    // Fetch all models to ensure they're registered
    const LeaveTypeModel = mongoose.model("LeaveType", LeaveType.schema);
    const EmployeeModel = mongoose.model("Employee", Employee.schema);
    const LeaveRequestModel = mongoose.model(
      "LeaveRequest",
      LeaveRequest.schema
    );

    // 1. First, check and fix inconsistencies in approved leave requests
    console.log("\nFetching all APPROVED leave requests...".yellow);
    const approvedLeaves = await LeaveRequestModel.find({ status: "APPROVED" })
      .populate("leave_type_id")
      .populate("emp_id");

    console.log(`Found ${approvedLeaves.length} approved leave requests`.cyan);

    // Track corrections needed
    const leaveCorrections = {};

    // Analyze each approved leave to ensure it was properly counted in balances
    for (const leave of approvedLeaves) {
      const empId = leave.emp_id ? leave.emp_id._id.toString() : null;
      const leaveTypeId = leave.leave_type_id
        ? leave.leave_type_id._id.toString()
        : null;
      const duration = leave.duration || 0;

      if (empId && leaveTypeId && duration > 0) {
        const key = `${empId}-${leaveTypeId}`;
        if (!leaveCorrections[key]) {
          leaveCorrections[key] = {
            emp_id: empId,
            leave_type_id: leaveTypeId,
            leaveName: leave.leave_type_id.leave_name,
            leaveCode: leave.leave_type_id.leave_code,
            totalApprovedDays: 0,
            leaves: [],
          };
        }
        leaveCorrections[key].totalApprovedDays += duration;
        leaveCorrections[key].leaves.push({
          id: leave._id,
          duration: duration,
          dates: `${leave.start_date
            .toISOString()
            .substring(0, 10)} to ${leave.end_date
            .toISOString()
            .substring(0, 10)}`,
        });
      }
    }

    // Fetch all leave balances
    console.log("\nFetching all leave balances...".yellow);
    const balances = await LeaveBalance.find({})
      .populate("leave_type_id")
      .populate("emp_id");
    console.log(`Found ${balances.length} leave balance records`.cyan);

    // 2. Check if the used_leaves match the total approved leave days
    let fixedCount = 0;
    let annualLeaveFixCount = 0;

    // First, do regular fixes
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
      const totalAllocation =
        balance.allocated_leaves + balance.carried_forward;
      if (balance.used_leaves > totalAllocation) {
        balance.used_leaves = totalAllocation;
        needsUpdate = true;
      }

      const availableForPending = totalAllocation - balance.used_leaves;
      if (balance.pending_leaves > availableForPending) {
        balance.pending_leaves = availableForPending;
        needsUpdate = true;
      }

      // Track especially if this is Annual Leave
      const isAnnualLeave =
        balance.leave_type_id && balance.leave_type_id.leave_code === "AL";

      // Now check against approved leave records for this employee and leave type
      const empId = balance.emp_id ? balance.emp_id._id.toString() : null;
      const leaveTypeId = balance.leave_type_id
        ? balance.leave_type_id._id.toString()
        : null;

      if (empId && leaveTypeId) {
        const key = `${empId}-${leaveTypeId}`;
        if (leaveCorrections[key]) {
          const approvedTotal = leaveCorrections[key].totalApprovedDays;

          // If the used_leaves doesn't match the approved total, update it
          if (balance.used_leaves !== approvedTotal) {
            console.log(
              `\nDiscrepancy in ${balance.leave_type_id.leave_name} for employee ${empId}:`
                .yellow
            );
            console.log(`  - Database used_leaves: ${balance.used_leaves}`);
            console.log(`  - Actual approved days: ${approvedTotal}`);
            console.log(
              `  - Approved leave records: ${JSON.stringify(
                leaveCorrections[key].leaves
              )}`
            );

            balance.used_leaves = approvedTotal;
            needsUpdate = true;

            if (isAnnualLeave) {
              annualLeaveFixCount++;
            }
          }
        }
      }

      if (needsUpdate) {
        try {
          await balance.save();
          fixedCount++;

          const leaveName = balance.leave_type_id
            ? balance.leave_type_id.leave_name
            : "Unknown";
          const empId = balance.emp_id ? balance.emp_id._id : "Unknown";

          console.log(
            `\nFixed leave balance for employee ${empId} - ${leaveName}:`.green
          );
          console.log("Before:".yellow, {
            used: original.used_leaves,
            pending: original.pending_leaves,
            carried: original.carried_forward,
            allocated: original.allocated_leaves,
            total: original.allocated_leaves + original.carried_forward,
          });
          console.log("After:".green, {
            used: balance.used_leaves,
            pending: balance.pending_leaves,
            carried: balance.carried_forward,
            allocated: balance.allocated_leaves,
            total: balance.allocated_leaves + balance.carried_forward,
          });
        } catch (saveError) {
          console.error(`Error saving balance:`.red, saveError.message);
        }
      }
    }

    console.log(`\nFixed ${fixedCount} leave balance records`.green);
    console.log(
      `Fixed ${annualLeaveFixCount} Annual Leave (AL) balance issues`.green
    );
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
