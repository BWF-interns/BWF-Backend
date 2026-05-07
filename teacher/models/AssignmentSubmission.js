const mongoose = require("mongoose");

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    student_auth_id: {
      type: String,
      required: true,
      index: true,
    },
    submissionText: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionNote: {
      type: String,
      default: "",
    },
    reviewed_by: {
      type: String,
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
    submitted_at: {
      type: Date,
      default: Date.now,
    },
    last_modified: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
