import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

dotenv.config({ path: path.join(rootDir, ".env") });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected to MongoDB");
  
  // Create a simple User model using the existing collection
  const User = mongoose.model("User", new mongoose.Schema({}), "users");
  
  // Find users with ADMIN role
  const admins = await User.find({ roles: { $elemMatch: { role: "ADMIN" } } }).select("username email");
  console.log("Admin users:", JSON.stringify(admins, null, 2));
  
  // Find all users
  const allUsers = await User.find().select("username email");
  console.log("All users:", JSON.stringify(allUsers, null, 2));
  
  mongoose.disconnect();
}).catch(err => console.error("MongoDB connection error:", err));
