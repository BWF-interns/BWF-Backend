const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    auth_id: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    anonymous: {
      type: Boolean,
      default: false
    },

    category: {
      type: String,
      enum: ["safety", "infrastructure", "food", "other"],
      default: "other"
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    status: {
      type: String,
      enum: ["OPEN", "RESOLVED", "ESCALATED"],
      default: "OPEN"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);