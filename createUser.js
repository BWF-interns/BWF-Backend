const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./models/User');
const Warden = require('./warden/models/warden'); // ✅ ADD THIS

async function createUser() {
  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash('123456', 10);

  // ✅ Create User (auth)
  const user = new User({
    name: 'Warden User',
    auth_id: 'warden@bwf.com',
    password: hashedPassword,
    role: 'warden'
  });

  await user.save();

  // ✅ Create Warden (profile)
  const warden = new Warden({
    userId: user._id,
    name: 'Warden User',
    email: 'warden@bwf.com',
    hostelName: 'A Block',
    phone: '9876543210'
  });

  await warden.save();

  console.log("✅ User + Warden created");
  process.exit();
}

createUser();