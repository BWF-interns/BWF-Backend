const mongoose = require("mongoose");

const mentorAssignmentSchema = new mongoose.Schema(
  {
    student_auth_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mentor_auth_id: {
      type: String,
      required: true,
      index: true,
    },
    mentor_name: {
      type: String,
      required: true,
    },
    assigned_by: {
      type: String,
      required: true,
    },
    last_modified: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MentorAssignment", mentorAssignmentSchema);
