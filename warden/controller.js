const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Warden = require('./models/warden');
const bcrypt = require('bcrypt');
const Staff = require('./models/staff');
const mongoose = require('mongoose');

// ================= CREATE STUDENT =================
const Student = require('../student/models/student');

async function createStudent(req, res) {
  try {
    const userId = req.user.id;
    const {
      name,
      auth_id,
      password,
      DOB,
      gender,
      contactNumber,
      class: studentClass,

      // optional
      email,
      address,
      schoolName,
      adhaarCard,
      panCard,
      interests,
      profilePictureUrl,
      avatarId,
      trustedPerson
    } = req.body;

    // ✅ Required validation
    if (!name || !auth_id || !password || !DOB || !gender || !contactNumber || !studentClass) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedAuthId = String(auth_id).trim();
    const plainPassword = String(password);

    if (!normalizedAuthId || !plainPassword) {
      return res.status(400).json({ message: "auth_id and password are required" });
    }

    // ✅ Get warden hostel
    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    // ✅ Check existing user
    if (!warden.hostelName) {
      return res.status(400).json({ message: "Warden is not assigned to a hostel" });
    }

    const existingUser = await User.findOne({ auth_id: normalizedAuthId });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existingStudent = await Student.findOne({ auth_id: normalizedAuthId });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // ✅ Create User (auth layer)
    const user = await User.create({
      name,
      auth_id: normalizedAuthId,
      password: hashedPassword,
      role: "student",
      hostelName: warden.hostelName
    });

    // ✅ Create Student (profile layer)
    const student = await Student.create({
      userId: user._id,
      auth_id: normalizedAuthId,
      name,
      DOB,
      gender,
      contactNumber,
      class: studentClass,
      hostelName: warden.hostelName,

      // optional
      email,
      address,
      schoolName,
      adhaarCard,
      panCard,
      interests,
      profilePictureUrl,
      avatarId,
      trustedPerson
    });

    return res.status(201).json({
      message: "Student created successfully",
      student
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}


async function getStudents(req, res) {
  try {
    const userId = req.user.id;

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const students = await Student.find({
      hostelName: warden.hostelName
    })
      .populate("hostelName")
      .select("-__v");

    return res.status(200).json(students);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateStudent(req, res) {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const student = await Student.findOne({
      _id: studentId,
      hostelName: warden.hostelName
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const linkedUser = await User.findById(student.userId);

    const updates = {};

    Object.keys(Student.schema.paths).forEach((field) => {
      const blockedFields = new Set([
        "_id",
        "__v",
        "userId",
        "hostelName",
        "createdAt",
        "updatedAt",
        "auth_id"
      ]);

      if (!blockedFields.has(field) && req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const userUpdates = {};

    if (req.body.auth_id !== undefined) {
      const nextAuthId = String(req.body.auth_id).trim();
      if (!nextAuthId) {
        return res.status(400).json({ message: "auth_id cannot be empty" });
      }

      if (nextAuthId !== student.auth_id) {
        const existingUserQuery = { auth_id: nextAuthId };
        if (linkedUser?._id) {
          existingUserQuery._id = { $ne: linkedUser._id };
        } else if (student.userId) {
          existingUserQuery._id = { $ne: student.userId };
        }

        const existingUser = await User.findOne(existingUserQuery);
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        const existingStudent = await Student.findOne({
          auth_id: nextAuthId,
          _id: { $ne: student._id }
        });
        if (existingStudent) {
          return res.status(400).json({ message: "Student already exists" });
        }
      }

      updates.auth_id = nextAuthId;
      userUpdates.auth_id = nextAuthId;
    }

    if (req.body.password !== undefined) {
      const nextPassword = String(req.body.password);
      if (!nextPassword) {
        return res.status(400).json({ message: "Password cannot be empty" });
      }

      userUpdates.password = await bcrypt.hash(nextPassword, 10);
    }

    if (updates.name !== undefined) {
      userUpdates.name = updates.name;
    }

    if (Object.keys(updates).length === 0 && Object.keys(userUpdates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (Object.keys(userUpdates).length > 0 && !linkedUser) {
      return res.status(404).json({
        message: "Linked student login user not found"
      });
    }

    if (Object.keys(userUpdates).length > 0) {
      linkedUser.set(userUpdates);
      await linkedUser.save();
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      updates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    return res.status(200).json(updatedStudent);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateStudentCredentials(req, res) {
  try {
    const userId = req.user.id;
    const { studentId } = req.params;
    const { auth_id, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const student = await Student.findOne({
      _id: studentId,
      hostelName: warden.hostelName
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const linkedUser = await User.findById(student.userId);
    if (!linkedUser) {
      return res.status(404).json({ message: "Linked student login user not found" });
    }

    const userUpdates = {};
    const studentUpdates = {};

    if (auth_id !== undefined) {
      const nextAuthId = String(auth_id).trim();
      if (!nextAuthId) {
        return res.status(400).json({ message: "auth_id cannot be empty" });
      }

      if (nextAuthId !== student.auth_id) {
        const existingUser = await User.findOne({
          auth_id: nextAuthId,
          _id: { $ne: linkedUser._id }
        });
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        const existingStudent = await Student.findOne({
          auth_id: nextAuthId,
          _id: { $ne: student._id }
        });
        if (existingStudent) {
          return res.status(400).json({ message: "Student already exists" });
        }
      }

      userUpdates.auth_id = nextAuthId;
      studentUpdates.auth_id = nextAuthId;
    }

    if (password !== undefined) {
      const nextPassword = String(password);
      if (!nextPassword) {
        return res.status(400).json({ message: "Password cannot be empty" });
      }

      userUpdates.password = await bcrypt.hash(nextPassword, 10);
    }

    if (Object.keys(userUpdates).length === 0) {
      return res.status(400).json({ message: "No credentials to update" });
    }

    await User.updateOne(
      { _id: linkedUser._id },
      { $set: userUpdates },
      { runValidators: true }
    );

    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      studentUpdates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    return res.status(200).json({
      message: "Student credentials updated successfully",
      student: updatedStudent
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
async function deleteStudent(req, res) {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 🔥 delete linked user
    await User.findByIdAndDelete(student.userId);

    await Student.findByIdAndDelete(studentId);

    return res.status(200).json({
      message: "Student deleted successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= CREATE STAFF =================
async function createStaff(req, res) {
  try {
    const userId = req.user.id;
    const {
      name,
      gender,
      contactNumber,
      roleName,
      joiningDate,

      // optional auth
      auth_id,
      password,

      // optional profile
      DOB,
      email,
      address,
      department,
      employmentType,
      shift,
      salary,
      status,
      adhaarCard,
      panCard,
      emergencyContact,
      notes
    } = req.body;

    if (!name || !gender || !contactNumber || !roleName || !joiningDate) {
      return res.status(400).json({
        message: "Missing required fields",
        requiredFields: ["name", "gender", "contactNumber", "roleName", "joiningDate"]
      });
    }

    if ((auth_id && !password) || (!auth_id && password)) {
      return res.status(400).json({
        message: "Both auth_id and password are required when creating a staff login"
      });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    if (!warden.hostelName) {
      return res.status(400).json({ message: "Warden is not assigned to a hostel" });
    }

    let user = null;

    if (auth_id) {
      const existingUser = await User.findOne({ auth_id });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const existingStaff = await Staff.findOne({ auth_id });
      if (existingStaff) {
        return res.status(400).json({ message: "Staff already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        name,
        auth_id,
        password: hashedPassword,
        role: "staff",
        hostelName: warden.hostelName
      });
    }

    try {
      const staff = await Staff.create({
        userId: user?._id,
        auth_id,
        registeredByWarden: warden._id,
        roleName,
        name,
        gender,
        DOB,
        email,
        contactNumber,
        address,
        hostelName: warden.hostelName,
        department,
        employmentType,
        shift,
        joiningDate,
        salary,
        status,
        adhaarCard,
        panCard,
        emergencyContact,
        notes
      });

      return res.status(201).json({
        message: "Staff created successfully",
        staff
      });
    } catch (err) {
      if (user) {
        await User.findByIdAndDelete(user._id);
      }
      throw err;
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= GET STAFF =================
async function getStaff(req, res) {
  try {
    const userId = req.user.id;

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const staff = await Staff.find({
      registeredByWarden: warden._id,
      hostelName: warden.hostelName
    })
      .populate("hostelName")
      .select("-__v");

    return res.status(200).json(staff);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= UPDATE STAFF =================
async function updateStaff(req, res) {
  try {
    const userId = req.user.id;
    const { staffId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid staff id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const allowedFields = [
      "roleName",
      "name",
      "gender",
      "DOB",
      "email",
      "contactNumber",
      "address",
      "department",
      "employmentType",
      "shift",
      "joiningDate",
      "salary",
      "status",
      "adhaarCard",
      "panCard",
      "emergencyContact",
      "notes"
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const staff = await Staff.findOneAndUpdate(
      {
        _id: staffId,
        registeredByWarden: warden._id,
        hostelName: warden.hostelName
      },
      updates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (updates.name && staff.userId) {
      await User.findByIdAndUpdate(staff.userId, { name: updates.name });
    }

    return res.status(200).json(staff);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateStaffCredentials(req, res) {
  try {
    const userId = req.user.id;
    const { staffId } = req.params;
    const { auth_id, password } = req.body;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid staff id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      registeredByWarden: warden._id,
      hostelName: warden.hostelName
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const linkedUser = await User.findById(staff.userId);
    if (!linkedUser) {
      return res.status(404).json({ message: "Linked staff login user not found" });
    }

    const userUpdates = {};
    const staffUpdates = {};

    if (auth_id !== undefined) {
      const nextAuthId = String(auth_id).trim();
      if (!nextAuthId) {
        return res.status(400).json({ message: "auth_id cannot be empty" });
      }

      if (nextAuthId !== staff.auth_id) {
        const existingUser = await User.findOne({
          auth_id: nextAuthId,
          _id: { $ne: linkedUser._id }
        });
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        const existingStaff = await Staff.findOne({
          auth_id: nextAuthId,
          _id: { $ne: staff._id }
        });
        if (existingStaff) {
          return res.status(400).json({ message: "Staff already exists" });
        }
      }

      userUpdates.auth_id = nextAuthId;
      staffUpdates.auth_id = nextAuthId;
    }

    if (password !== undefined) {
      const nextPassword = String(password);
      if (!nextPassword) {
        return res.status(400).json({ message: "Password cannot be empty" });
      }

      userUpdates.password = await bcrypt.hash(nextPassword, 10);
    }

    if (Object.keys(userUpdates).length === 0) {
      return res.status(400).json({ message: "No credentials to update" });
    }

    await User.updateOne(
      { _id: linkedUser._id },
      { $set: userUpdates },
      { runValidators: true }
    );

    const updatedStaff = await Staff.findByIdAndUpdate(
      staff._id,
      staffUpdates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    return res.status(200).json({
      message: "Staff credentials updated successfully",
      staff: updatedStaff
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= DELETE STAFF =================
async function deleteStaff(req, res) {
  try {
    const userId = req.user.id;
    const { staffId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ message: "Invalid staff id" });
    }

    const warden = await Warden.findOne({ userId });
    if (!warden) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      registeredByWarden: warden._id,
      hostelName: warden.hostelName
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (staff.userId) {
      await User.findByIdAndDelete(staff.userId);
    }

    await Staff.findByIdAndDelete(staffId);

    return res.status(200).json({
      message: "Staff deleted successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ================= GET WARDEN PROFILE =================
async function getWardenProfile(req, res) {
  try {
    const userId = req.user.id;
    console.log('=== GET WARDEN PROFILE ===');
    console.log('userId:', userId);
    console.log('User data:', req.user);

    const warden = await Warden.findOne({ userId }).populate("hostelName");
    console.log('Warden found:', !!warden);
    if (warden) {
      console.log('Warden ID:', warden._id);
      console.log('Warden hostelName:', warden.hostelName);
    }

    if (!warden) {
      console.log('❌ No warden record found for userId:', userId);
      return res.status(404).json({ 
        message: "Warden not found",
        debug: { userId }
      });
    }

    console.log('✅ Returning warden profile');
    return res.status(200).json(warden);

  } catch (err) {
    console.error('❌ Error in getWardenProfile:', err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
}

// ================= UPDATE WARDEN PROFILE =================
async function updateWardenProfile(req, res) {
  try {
    const userId = req.user.id;
    console.log('=== UPDATE WARDEN PROFILE ===');
    console.log('userId:', userId);
    console.log('Request body:', req.body);

    const allowedFields = [
      "name",
      "email",
      "phone",
      "gender",
      "DOB",
      "address",
      "qualification",
      "joiningDate",
      "status",
      "emergencyContact",
      "profilePic",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    console.log('Updates to apply:', updates);

    // ✅ Prevent empty update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const warden = await Warden.findOneAndUpdate(
      { userId },
      updates,
      { new: true, runValidators: true }
    ).populate("hostelName");

    if (!warden) {
      console.log('❌ No warden record found for userId:', userId);
      return res.status(404).json({ 
        message: "Warden not found",
        debug: { userId }
      });
    }

    console.log('✅ Warden updated:', warden._id);
    return res.status(200).json(warden);

  } catch (err) {
    console.error('❌ Error in updateWardenProfile:', err);
    return res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
}

module.exports = {
  createStudent,
  getStudents,
  updateStudent,
  updateStudentCredentials,
  deleteStudent,
  createStaff,
  getStaff,
  updateStaff,
  updateStaffCredentials,
  deleteStaff,
  getWardenProfile,
  updateWardenProfile,
};
