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
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Request logger middleware (exclude favicon requests)
app.use((req, res, next) => {
  if (req.originalUrl !== '/favicon.ico') {
    console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  }
  next();
});

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

// Handle favicon requests to prevent 404 errors
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// Debug endpoint for API verification
app.get("/api/debug", (req, res) => {
  res.json({
    status: "ok",
    message: "API is working correctly",
    timestamp: new Date().toISOString(),
    routes: {
      auth: "/api/auth",
      user: "/api/user",
      employees: "/api/employees",
      attendance: "/api/attendance",
      notifications: "/api/notifications",
    },
  });
});

// Debug endpoint to check test credentials
app.get("/api/debug/auth", async (req, res) => {
  try {
    const User = (await import("./models/User.js")).default;
    const users = await User.find().select("username email roles").limit(5);

    res.json({
      status: "ok",
      message: "These are sample users for testing",
      timestamp: new Date().toISOString(),
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      })),
      note: "Use these credentials for testing the notification system",
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve users",
      error: error.message,
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/user", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
