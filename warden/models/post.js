const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

const postSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    author: {
      type: String,
      required: true,
    },
    content: {
      type: String,
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
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Forwarded'],
      default: 'Pending',
    },
    type: {
      type: String,
      enum: ['text', 'poll'],
      default: 'text',
    },
    tags: [{
      type: String,
    }],
    pollOptions: [pollOptionSchema],
    rejectionReason: {
      type: String,
    },
    forwardReason: {
      type: String,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
    },
    creatorRole: {
      type: String,
      required: true,
      // Supporting all possible creators
    },
    hostelName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
