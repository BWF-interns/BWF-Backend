const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    requestedBy: {
      type: String,
      required: true,
    },

    requesterRole: {
      type: String,
      enum: ['Student', 'Teacher', 'Warden'],
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String, // Format: HH:mm
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    participants: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      enum: ['Cultural', 'Sports', 'Technical', 'Academic', 'Social', 'Entertainment'],
      required: true,
    },

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },

    rejectionReason: {
      type: String,
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warden',
      required: true,
    },

    hostelName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);