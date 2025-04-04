import dotenv from "dotenv";
import colors from "colors";
import app from "./app.js";
import connectDB from "./config/database.js";

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Define the port
const PORT = process.env.PORT || 5000;

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
