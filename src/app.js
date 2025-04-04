import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { notFound, errorHandler } from "./utils/errorHandler.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Log requests in development mode
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Welcome route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Attendance System API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/roles", roleRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
