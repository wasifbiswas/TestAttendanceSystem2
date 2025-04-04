import { exec } from "child_process";
import { promisify } from "util";
import colors from "colors";

const execPromise = promisify(exec);

async function runScript(scriptPath, description) {
  console.log(`\n${description}...`.cyan);
  try {
    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
    if (stderr) {
      console.error(`Error: ${stderr}`.red);
    }
    console.log(stdout);
    return true;
  } catch (error) {
    console.error(`Failed to execute ${scriptPath}: ${error.message}`.red);
    return false;
  }
}

async function setup() {
  console.log("\n=============================================".yellow);
  console.log("    ATTENDANCE SYSTEM SETUP SCRIPT".green.bold);
  console.log("=============================================\n".yellow);

  console.log("This script will set up your development environment:".cyan);
  console.log("1. Initialize user roles".cyan);
  console.log("2. Add leave types\n".cyan);

  try {
    // Run initialization scripts
    const roleSuccess = await runScript(
      "scripts/initDb.js",
      "Initializing user roles"
    );
    if (!roleSuccess) {
      throw new Error("Role initialization failed");
    }

    const leavesSuccess = await runScript(
      "scripts/addLeaveTypes.js",
      "Adding leave types"
    );
    if (!leavesSuccess) {
      throw new Error("Leave types initialization failed");
    }

    console.log("\n=============================================".yellow);
    console.log("    SETUP COMPLETED SUCCESSFULLY".green.bold);
    console.log("=============================================\n".yellow);
    console.log("You can now start the server with:".cyan);
    console.log("npm run dev".green);
  } catch (error) {
    console.error("\n=============================================".red);
    console.error("    SETUP FAILED".red.bold);
    console.error("=============================================\n".red);
    console.error(`Error: ${error.message}`.red);
    process.exit(1);
  }
}

setup();
