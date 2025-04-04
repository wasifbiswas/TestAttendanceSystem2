import dotenv from "dotenv";
import colors from "colors";
import connectDB from "../src/config/database.js";
import LeaveType from "../src/models/LeaveType.js";

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const leaveTypes = [
  {
    leave_code: "AL",
    leave_name: "Annual Leave",
    description: "Regular paid leave for vacation or personal time",
    is_carry_forward: true,
    default_annual_quota: 20,
    requires_approval: true,
    max_consecutive_days: 15,
  },
  {
    leave_code: "SL",
    leave_name: "Sick Leave",
    description: "Leave due to illness or medical appointments",
    is_carry_forward: false,
    default_annual_quota: 12,
    requires_approval: true,
    max_consecutive_days: 5,
  },
  {
    leave_code: "CL",
    leave_name: "Casual Leave",
    description: "Short-notice leave for personal matters",
    is_carry_forward: false,
    default_annual_quota: 6,
    requires_approval: true,
    max_consecutive_days: 3,
  },
  {
    leave_code: "ML",
    leave_name: "Maternity Leave",
    description: "Leave for female employees before and after childbirth",
    is_carry_forward: false,
    default_annual_quota: 180, // Usually provided in days
    requires_approval: true,
    max_consecutive_days: 180,
  },
  {
    leave_code: "PL",
    leave_name: "Paternity Leave",
    description: "Leave for male employees after their child's birth",
    is_carry_forward: false,
    default_annual_quota: 15,
    requires_approval: true,
    max_consecutive_days: 15,
  },
  {
    leave_code: "BL",
    leave_name: "Bereavement Leave",
    description: "Leave due to death of a family member",
    is_carry_forward: false,
    default_annual_quota: 5,
    requires_approval: true,
    max_consecutive_days: 5,
  },
  {
    leave_code: "MRL",
    leave_name: "Marriage Leave",
    description: "Leave for employee's own marriage",
    is_carry_forward: false,
    default_annual_quota: 5,
    requires_approval: true,
    max_consecutive_days: 5,
  },
  {
    leave_code: "STL",
    leave_name: "Study Leave",
    description: "Leave for educational purposes or examinations",
    is_carry_forward: false,
    default_annual_quota: 10,
    requires_approval: true,
    max_consecutive_days: 10,
  },
  {
    leave_code: "UPL",
    leave_name: "Unpaid Leave",
    description: "Leave without pay for extended absences",
    is_carry_forward: false,
    default_annual_quota: 30,
    requires_approval: true,
    max_consecutive_days: 30,
  },
  {
    leave_code: "WFH",
    leave_name: "Work From Home",
    description: "Working remotely from home or other location",
    is_carry_forward: false,
    default_annual_quota: 60,
    requires_approval: true,
    max_consecutive_days: 10,
  },
  {
    leave_code: "COMP",
    leave_name: "Compensatory Off",
    description: "Leave granted for working on holidays or weekends",
    is_carry_forward: false,
    default_annual_quota: 10,
    requires_approval: true,
    max_consecutive_days: 5,
  },
  {
    leave_code: "PH",
    leave_name: "Public Holiday",
    description: "Official holidays as per company calendar",
    is_carry_forward: false,
    default_annual_quota: 12, // Typical number of public holidays
    requires_approval: false,
    max_consecutive_days: 3,
  },
];

const initializeLeaveTypes = async () => {
  try {
    // Delete existing leave types
    const deleteResult = await LeaveType.deleteMany({});
    console.log(
      `Deleted ${deleteResult.deletedCount} existing leave types`.red
    );

    // Insert new leave types
    const createdLeaveTypes = await LeaveType.insertMany(leaveTypes, {
      ordered: false,
    });
    console.log(
      `Successfully created ${createdLeaveTypes.length} leave types:`.green
    );

    // Log each leave type
    createdLeaveTypes.forEach((type) => {
      console.log(
        `- ${type.leave_name} (${type.leave_code}): ${type.default_annual_quota} days`
          .cyan
      );
    });

    // Verify all leave types
    const allLeaveTypes = await LeaveType.find({}).sort({ leave_code: 1 });
    console.log(
      `\nTotal leave types in database: ${allLeaveTypes.length}`.yellow
    );

    // Check for missing leave types
    const dbCodes = allLeaveTypes.map((lt) => lt.leave_code);
    const missingLeaveTypes = leaveTypes.filter(
      (lt) => !dbCodes.includes(lt.leave_code)
    );

    if (missingLeaveTypes.length > 0) {
      console.log(
        `\nWarning: ${missingLeaveTypes.length} leave types were not created:`
          .red
      );
      missingLeaveTypes.forEach((type) => {
        console.log(`- ${type.leave_name} (${type.leave_code})`.red);
      });
    }

    console.log("\nLeave types initialization completed".green);
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`.red);

    // If it's a duplicate key error, provide more specific information
    if (error.code === 11000) {
      console.error(`Duplicate leave code detected`.red);
    }

    process.exit(1);
  }
};

initializeLeaveTypes();
