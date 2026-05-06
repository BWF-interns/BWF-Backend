const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./models/User');     // adjust path
const Student = require('./student/models/student');
const Assignment = require('./student/models/assignment');
const StudentAssignment = require('./student/models/student_assignment');
const CommunityPost = require('./models/CommunityPost');

const seedData = async () => {
  try {
    // Check if already exists
    const existingUser = await User.findOne({ auth_id: 'BWF-2026-1' });

    if (existingUser) {
      console.log('⚠️ Dummy user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create User
    const user = await User.create({
      name: 'Test Student',
      auth_id: 'BWF-2026-1',
      password: hashedPassword,
      role: 'student'
    });

    // Create Student Profile
    await Student.create({
      userId: user._id,
      auth_id: user.auth_id,
      name: user.name,
      DOB: new Date('2008-05-10'),
      bio: 'I love learning and coding!',
      gender: 'male',
      email: 'test@student.com',
      contactNumber: '9876543210',
      address: 'Pune, India',
      classInfo: '10th Grade',
      schoolName: 'ABC School',
      interests: ['coding', 'football'],
      trustedPerson: {
        name: 'Father',
        phone: '9999999999',
        relation: 'Parent'
      }
    });

    // Create Assignments (MASTER DATA)
const assignments = await Assignment.insertMany([
  {
    auth_id: user.auth_id,
    title: "Math Worksheet 11",
    subject: "Mathematics",
    dueDate: "2026-04-24",
    priority: "high"
  },
  {
    auth_id: user.auth_id,
    title: "Science Projectt",
    subject: "Science",
    dueDate: "2026-04-23",
    priority: "medium"
  },
  {
    auth_id: user.auth_id,
    title: "English Essayy",
    subject: "English",
    dueDate: "2026-04-25",
    priority: "low"
  },
  {
    auth_id: user.auth_id,
    title: "History Timelinee",
    subject: "History",
    dueDate: "2026-04-24",
    priority: "medium"
  },
  {
    auth_id: user.auth_id,
    title: "Biology Notees",
    subject: "Science",
    dueDate: "2026-04-26",
    priority: "low"
  }
]);

// Create StudentAssignment (USER STATE)
await StudentAssignment.insertMany([
  {
    auth_id: user.auth_id,
    assignment_id: assignments[0]._id,
    status: "verified",
    submittedDate: "2026-04-23"
  },
  {
    auth_id: user.auth_id,
    assignment_id: assignments[1]._id,
    status: "verified",
    submittedDate: "2026-04-22"
  },
  {
    auth_id: user.auth_id,
    assignment_id: assignments[2]._id,
    status: "under_review"
  },
  {
    auth_id: user.auth_id,
    assignment_id: assignments[3]._id,
    status: "student_submitted"
  },
  {
    auth_id: user.auth_id,
    assignment_id: assignments[4]._id,
    status: "todo"
  }
]);

await CommunityPost.insertMany([
  {
    userId: user._id,
    author: user.name,
    avatarId: "bunny",
    role: "Student",
    category: "Win",
    content:
      "I finally completed my Math Worksheet after struggling for 2 days! Feeling proud of my progress 💪",
    likes: 12,
    mediaUrl: null,
  },
  {
    userId: user._id,
    author: user.name,
    avatarId: "rocket",
    role: "Student",
    category: "Gratitude",
    content:
      "Huge thanks to my mentor for helping me stay consistent. This platform is really changing my habits 💛",
    likes: 25,
  },
  {
    userId: user._id,
    author: "BWF Admin",
    avatarId: "star",
    role: "Admin",
    category: "Highlight",
    content:
      "Welcome to the BWF community! Keep sharing your wins and stories 🌟",
    likes: 40,
  }
]);

    console.log('✅ Dummy data inserted');

  } catch (err) {
    console.error('❌ Error seeding data:', err.message);
  }
};

module.exports = seedData;
