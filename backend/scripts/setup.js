import { exec } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import colors from "colors";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Promisify exec
const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command}`.cyan);
    exec(command, { env: process.env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`.red);
        console.error(`stderr: ${stderr}`.red);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`stderr: ${stderr}`.yellow);
      }
      console.log(`stdout: ${stdout}`.green);
      resolve(stdout);
    });
  });
};

const setup = async () => {
  try {
    console.log("Starting setup...".green);

    // Run init-db.js to initialize user roles
    console.log("Initializing user roles...".cyan);
    await execPromise(`node ${join(__dirname, "initDb.js")}`);
    console.log("User roles initialized successfully".green);

    // Run add-leave-types.js to add leave types
    console.log("Adding leave types...".cyan);
    await execPromise(`node ${join(__dirname, "addLeaveTypes.js")}`);
    console.log("Leave types added successfully".green);

    console.log("\nSetup completed successfully!".green.bold);
    console.log("You can now start the server with:".cyan);
    console.log("  npm run dev".yellow);

    process.exit(0);
  } catch (error) {
    console.error(`\nSetup failed: ${error.message}`.red.bold);
    process.exit(1);
  }
};

setup();
