const mongoose = require("mongoose");

const wardenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
    },

    hostelName: {
      type: String,
    },

    phone: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Warden", wardenSchema);