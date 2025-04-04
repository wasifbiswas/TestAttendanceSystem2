import mongoose from "mongoose";

const userRoleSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    assigned_date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for user_id and role_id to ensure uniqueness
userRoleSchema.index({ user_id: 1, role_id: 1 }, { unique: true });

const UserRole = mongoose.model("UserRole", userRoleSchema);

export default UserRole;
