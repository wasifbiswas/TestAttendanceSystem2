import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    // Use the environment variable or fall back to a default value
    const mongoURI =
      process.env.MONGO_URI || "mongodb://localhost:27017/attendance_system";
    console.log("Connecting to MongoDB with URI:", mongoURI);

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
