/**
 * One-off script: create a teacher user for local login testing.
 * Run: node createTeacher.js
 * Requires .env with MONGO_URI and valid JWT secrets (copy from .env.example).
 */
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");

async function main() {
  if (!process.env.MONGO_URI || !process.env.MONGO_URI.startsWith("mongodb")) {
    console.error("Set MONGO_URI in .env to a valid mongodb:// or mongodb+srv:// string.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const authId = process.env.SEED_TEACHER_AUTH_ID || "teacher@bwf.com";
  const plainPassword = process.env.SEED_TEACHER_PASSWORD || "Teacher@123";
  const name = process.env.SEED_TEACHER_NAME || "Teacher User";

  const existing = await User.findOne({ auth_id: authId });
  if (existing) {
    console.log("User already exists:", authId, "role:", existing.role);
    if (existing.role !== "teacher") {
      console.log("Update role to teacher in MongoDB or use a different SEED_TEACHER_AUTH_ID.");
    }
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  await User.create({
    name,
    auth_id: authId,
    password: hashedPassword,
    role: "teacher",
  });

  console.log("Teacher user created.");
  console.log("  Sign in with ID:", authId);
  console.log("  Password:", plainPassword);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
