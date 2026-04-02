const User = require('../models/User');
const Warden = require('./models/warden');
const bcrypt = require('bcrypt');

async function createStudent(req, res) {
  try {
    const { name, auth_id, password } = req.body;

    // Basic validation
    if (!name || !auth_id || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ auth_id });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = new User({
      name,
      auth_id,
      password: hashedPassword,
      role: 'student'
    });

    await student.save();

    return res.status(201).json({
      message: "Student created successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}



async function getWardenProfile(req, res) {
  try {
    const userId = req.user.id;

    const warden = await Warden.findOne({ userId });

    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    return res.status(200).json(warden);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
module.exports = {
  createStudent,
  getWardenProfile
};