import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    join_date: {
      type: Date,
      default: Date.now,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    contact_number: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving to database
userSchema.pre("save", async function (next) {
  // Only hash if password_hash is modified
  if (!this.isModified("password_hash")) {
    return next();
  }

  try {
    console.log("Hashing password for user:", this.username);
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    console.log("Password hashed successfully");
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// Method to match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

const User = mongoose.model("User", userSchema);

export default User;
