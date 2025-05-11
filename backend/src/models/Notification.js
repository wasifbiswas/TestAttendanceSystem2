import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipients: {
      type: [
        {
          user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          read: {
            type: Boolean,
            default: false,
          },
          read_at: {
            type: Date,
            default: null,
          },
        },
      ],
      default: [],
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    all_employees: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
      default: function () {
        // Default expiration is 30 days after creation
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster lookups
notificationSchema.index({ "recipients.user_id": 1 });
notificationSchema.index({ department_id: 1 });
notificationSchema.index({ sender_id: 1 });
notificationSchema.index({ created_at: -1 });
notificationSchema.index({ expires_at: 1 });

// Create Notification model
const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
