import dotenv from "dotenv";
import colors from "colors";
import app from "./app.js";
import connectDB from "./config/database.js";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");

// Load environment variables from root directory
dotenv.config({ path: path.join(rootDir, ".env") });

// Connect to the database
connectDB();

// Define the port - use 5002 instead of 5001 to avoid conflict
const PORT = process.env.PORT || 5002;

// Start the server
const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
