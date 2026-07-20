const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Core Models
const User = require('./models/User');
const Hostel = require('./models/Hostel');
const CommunityPost = require('./models/CommunityPost');

// Student Models
const Student = require('./student/models/student');
const Assignment = require('./student/models/assignment');
const StudentAssignment = require('./student/models/student_assignment');
const MoodLog = require('./student/models/moodLog');
const Journal = require('./student/models/journal');
const Complaint = require('./student/models/complaints');
const Notice = require('./student/models/Notice');
const NoticeInteraction = require('./student/models/NoticeInteraction');
const CounsellingRequest = require('./student/models/counsellingRequest');
const DailyTask = require('./student/models/dailyTask');

// Teacher Models
const Teacher = require('./teacher/models/teacher');
const TeacherSchedule = require('./teacher/models/schedule');
const MentorNote = require('./student/models/mentorNote');

// Warden Models
const Warden = require('./warden/models/warden');
const Staff = require('./warden/models/staff');
const WardenComplaint = require('./warden/models/complaints');
const Activity = require('./warden/models/activity');
const Expense = require('./warden/models/expenses');

// Environment
require('dotenv').config();

const parseExcelFile = (filename, dataRowOffset = 2) => {
  const rootDir = path.join(__dirname, '..');
  const filePath = path.join(rootDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File not found: ${filename}`);
    return [];
  }
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Data usually starts at index 2 (row 3) for most, but depends on the file.
  // We will slice from dataRowOffset
  return data.slice(dataRowOffset).filter(row => row && row.length > 0 && row.some(cell => cell));
};

// Generic util to extract an age integer from string like '18yrs' or '15'
const parseAge = (ageStr) => {
  if (!ageStr) return 15; // default 15
  const match = String(ageStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : 15;
};

// Generic util to map class to backend schema ENUM
const mapClass = (classStr) => {
  if (!classStr) return '10th Grade';
  const str = String(classStr).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (str.includes('1st') || str === '1') return '1st Grade';
  if (str.includes('2nd') || str === '2') return '2nd Grade';
  if (str.includes('3rd') || str === '3') return '3rd Grade';
  if (str.includes('4th') || str === '4') return '4th Grade';
  if (str.includes('5th') || str === '5') return '5th Grade';
  if (str.includes('6th') || str === '6') return '6th Grade';
  if (str.includes('7th') || str === '7') return '7th Grade';
  if (str.includes('8th') || str === '8') return '8th Grade';
  if (str.includes('9th') || str === '9') return '9th Grade';
  if (str.includes('10th') || str === '10') return '10th Grade';
  if (str.includes('11th') || str === '11') return '11th Grade';
  if (str.includes('12th') || str === '12') return '12th Grade';
  return '10th Grade';
};

const mapRole = (designation) => {
  if (!designation) return 'staff';
  const d = String(designation).toLowerCase();
  if (d.includes('warden') || d.includes('superintendent') || d.includes('in-charge') || d.includes('house mother')) return 'warden';
  if (d.includes('teacher') || d.includes('tutor') || d.includes('educator')) return 'teacher';
  return 'staff';
};

const sanitizeId = (str, role, index) => {
  if (!str) return `${role.toUpperCase()}-${index}`;
  return `${role.toUpperCase()}-${String(str).split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '')}-${index}`;
};

const seedMaster = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/bwf-db';
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoURI);
      console.log('✅ Connected to MongoDB for Master Seeding...');
    }

    console.log('🧹 Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}), Hostel.deleteMany({}), CommunityPost.deleteMany({}),
      Student.deleteMany({}), Assignment.deleteMany({}), StudentAssignment.deleteMany({}),
      MoodLog.deleteMany({}), Journal.deleteMany({}), Complaint.deleteMany({}),
      Notice.deleteMany({}), NoticeInteraction.deleteMany({}), CounsellingRequest.deleteMany({}),
      DailyTask.deleteMany({}), Teacher.deleteMany({}), TeacherSchedule.deleteMany({}),
      MentorNote.deleteMany({}), Warden.deleteMany({}), Staff.deleteMany({}),
      WardenComplaint.deleteMany({}), Activity.deleteMany({}), Expense.deleteMany({})
    ]);

    const hashedPassword = await bcrypt.hash('123456', 10);

    // 1. Hostels
    const hostels = {
      anantnag: await Hostel.create({ name: 'Anantnag Home', location: 'Anantnag', capacity: 100 }),
      kupwara: await Hostel.create({ name: 'Kupwara Home', location: 'Kupwara', capacity: 100 }),
      beerwah: await Hostel.create({ name: 'Beerwah Home', location: 'Beerwah', capacity: 100 }),
      jammu: await Hostel.create({ name: 'Jammu Home', location: 'Jammu', capacity: 100 })
    };
    console.log('🏨 Created Hostels');

    let globalStudentCounter = 1;
    let globalStaffCounter = 1;

    const createStudent = async (name, ageStr, classStr, parentage, address, hostelKey) => {
      if (!name) return null;
      const age = parseAge(ageStr);
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - age);
      const auth_id = sanitizeId(name, 'STUDENT', globalStudentCounter++);
      
      const user = await User.create({ name, auth_id, password: hashedPassword, role: 'student' });
      const student = await Student.create({
        userId: user._id, auth_id, name, gender: 'female', // Defaulting to female based on sample data
        hostelName: hostels[hostelKey]._id, classInfo: mapClass(classStr), mentorName: 'Not Assigned',
        DOB: dob, bio: `Parentage: ${parentage || 'N/A'}. Address: ${address || 'N/A'}`,
        email: `${auth_id.toLowerCase()}@bwf.com`, contactNumber: '9999999999'
      });
      return student;
    };

    const createStaffMember = async (name, designation, ageStr, parentage, address, hostelKey) => {
      if (!name) return null;
      const role = mapRole(designation);
      const auth_id = sanitizeId(name, role.toUpperCase(), globalStaffCounter++);
      
      const user = await User.create({ name, auth_id, password: hashedPassword, role });
      
      if (role === 'warden') {
        const warden = await Warden.create({
          userId: user._id, name, email: `${auth_id.toLowerCase()}@bwf.com`,
          hostelName: hostels[hostelKey]._id, phone: '9999999999', gender: 'female', status: 'Active'
        });
        return { type: 'warden', doc: warden };
      } else if (role === 'teacher') {
        const teacher = await Teacher.create({
          userId: user._id, name, auth_id, email: `${auth_id.toLowerCase()}@bwf.com`,
          phone: '9999999999', bio: designation || 'Educator'
        });
        return { type: 'teacher', doc: teacher };
      } else {
        const staff = await Staff.create({
          userId: user._id, auth_id, name, role: 'staff', roleName: designation || 'Staff',
          hostelName: hostels[hostelKey]._id, status: 'Active', gender: 'female', 
          email: `${auth_id.toLowerCase()}@bwf.com`, contactNumber: '9999999999', joiningDate: new Date()
        });
        return { type: 'staff', doc: staff };
      }
    };

    const importedStudents = [];
    const importedStaff = { wardens: [], teachers: [], staffs: [] };

    console.log('🔄 Parsing Excel files and importing records...');

    // ---------------------------------------------------------
    // Anantnag Students (Headers in Row 1 => data[1], data starts at row 2)
    // S.no[0], name[1], class[2], age[3], parentage[4], address[5]
    let rows = parseExcelFile('present list of Anantnag students.xlsx', 2);
    for (const row of rows) {
      const st = await createStudent(row[1], row[3], row[2], row[4], row[5], 'anantnag');
      if (st) importedStudents.push(st);
    }

    // Kupwara Students (Headers in Row 1 => data[1], data starts at row 2)
    // [0], Name[1], Age[2], Class[3], Parentage[4], Address[5]
    rows = parseExcelFile('Present List of Children at Kupwara home.xlsx', 2);
    for (const row of rows) {
      const st = await createStudent(row[1], row[2], row[3], row[4], row[5], 'kupwara');
      if (st) importedStudents.push(st);
    }

    // Beerwah Students (Headers in Row 0 => data[0], data starts at row 2 because row 1 is empty in sample)
    // Name[0], Age[1], class[2], parentage[3], [4], [5]address
    rows = parseExcelFile('present student list of Beerwah home.xlsx', 2);
    for (const row of rows) {
      const st = await createStudent(row[0], row[1], row[2], row[3], row[5], 'beerwah');
      if (st) importedStudents.push(st);
    }

    // Jammu Students (Headers in Row 0 => data[0], data starts at row 1)
    // Sr.no[0], Name[1], Age[2], Class[3], Parentage[4], Address[5]
    rows = parseExcelFile('Studentslistapril2026.xlsx', 1);
    for (const row of rows) {
      const st = await createStudent(row[1], row[2], row[3], row[4], row[5], 'jammu');
      if (st) importedStudents.push(st);
    }
    console.log(`👨‍🎓 Imported ${importedStudents.length} Students from Excel.`);

    // ---------------------------------------------------------
    // Anantnag Staff (Headers in Row 1, data starts row 2)
    // S no.[0], Name[1], Designation[2]
    rows = parseExcelFile('Present List of Staff at Anantnag Home Home.xlsx', 2);
    for (const row of rows) {
      const sf = await createStaffMember(row[1], row[2], null, null, null, 'anantnag');
      if (sf) importedStaff[`${sf.type}s`].push(sf.doc);
    }

    // Kupwara Staff (Headers in Row 1, data starts row 2)
    // S no.[0], Name[1], Designation[2]
    rows = parseExcelFile('Present List of Staff at Kupwara Home.xlsx', 2);
    for (const row of rows) {
      const sf = await createStaffMember(row[1], row[2], null, null, null, 'kupwara');
      if (sf) importedStaff[`${sf.type}s`].push(sf.doc);
    }

    // Beerwah Staff (Headers in Row 0, data starts row 1)
    // Name[0], Age[1], Designation[2], [3], parentage[4], [5], Adress[6]
    rows = parseExcelFile('present staff list Beerwah home.xlsx', 1);
    for (const row of rows) {
      const sf = await createStaffMember(row[0], row[2], row[1], row[4], row[6], 'beerwah');
      if (sf) importedStaff[`${sf.type}s`].push(sf.doc);
    }

    // Jammu Staff (Headers in Row 1, data starts row 2)
    // Sr.No[0], Name of Staff[1], Designation[2]
    rows = parseExcelFile('Staff-list.xlsx', 2);
    for (const row of rows) {
      const sf = await createStaffMember(row[1], row[2], null, null, null, 'jammu');
      if (sf) importedStaff[`${sf.type}s`].push(sf.doc);
    }
    console.log(`🧑‍🏫 Imported Staff from Excel (Wardens: ${importedStaff.wardens.length}, Teachers: ${importedStaff.teachers.length}, General: ${importedStaff.staffs.length}).`);

    // Ensure we have at least one teacher and one warden for dummy data associations
    let teacher = importedStaff.teachers[0];
    if (!teacher) {
      const teacherUser = await User.create({ name: 'System Teacher', auth_id: 'TEACHER-SYS-1', password: hashedPassword, role: 'teacher' });
      teacher = await Teacher.create({ userId: teacherUser._id, name: teacherUser.name, auth_id: teacherUser.auth_id, email: 'sys_teacher@bwf.com', phone: '000000', bio: 'Fallback Teacher' });
      importedStaff.teachers.push(teacher);
    }

    let warden = importedStaff.wardens[0];
    if (!warden) {
      const wardenUser = await User.create({ name: 'System Warden', auth_id: 'WARDEN-SYS-1', password: hashedPassword, role: 'warden' });
      warden = await Warden.create({ userId: wardenUser._id, name: wardenUser.name, email: 'sys_warden@bwf.com', hostelName: hostels.kupwara._id, phone: '00000', gender: 'female', status: 'Active' });
      importedStaff.wardens.push(warden);
    }

    // 4. Assignments & Tasks
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 5);

    const assignment = await Assignment.create({
      auth_id: 'ASSIGNMENT-1', title: 'Mathematics Algebra Set 1', description: 'Complete all 20 questions from chapter 4.',
      dueDate: futureDate, assignedBy: teacher._id, points: 50, subject: 'Mathematics'
    });

    if (importedStudents.length > 0) {
      await StudentAssignment.create({
        auth_id: importedStudents[0].auth_id, assignment_id: assignment._id, status: 'verified'
      });
      if (importedStudents.length > 1) {
        await StudentAssignment.create({
          auth_id: importedStudents[1].auth_id, assignment_id: assignment._id, status: 'todo'
        });
      }
    }
    console.log('📝 Created Sample Assignments');

    // 5. Wellbeing (Mood & Journal)
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (importedStudents.length > 0) {
      await MoodLog.create([
        { auth_id: importedStudents[0].auth_id, mood: 'happy', date: todayStr },
        { auth_id: importedStudents[0].auth_id, mood: 'need_help', date: yesterdayStr }
      ]);
      await Journal.create({
        auth_id: importedStudents[0].auth_id, title: 'My Goals', body: 'I want to improve my math scores this month.', date: todayStr
      });
      
      // Counselling Request
      await CounsellingRequest.create({
        auth_id: importedStudents[0].auth_id, message: 'I feel overwhelmed with academic stress.',
        status: 'pending'
      });
    }
    console.log('❤️ Created Sample Wellbeing Data');

    // 6. Community & Notices
    if (importedStudents.length > 1) {
      await CommunityPost.insertMany([
        { userId: importedStudents[0].userId, author: importedStudents[0].name, role: 'Student', category: 'Win', content: 'Does anyone have notes for Science?', isVerified: true },
        { userId: importedStudents[1].userId, author: importedStudents[1].name, role: 'Student', category: 'Story', content: 'Our team won the debate!', isVerified: false },
        { userId: warden.userId, author: warden.name, role: 'Warden', category: 'Highlight', content: 'Welcome to the new academic year!', isVerified: true }
      ]);
    }

    const notice = await Notice.create({
      title: 'Holiday Announcement', body: 'School will be closed on Friday.', category: 'general',
      createdBy: teacher.userId, authorName: teacher.name, targetAudience: 'All', publishedDate: todayStr
    });

    if (importedStudents.length > 0) {
      await NoticeInteraction.create({ noticeId: notice._id, auth_id: importedStudents[0].auth_id, isRead: true });
    }
    console.log('📢 Created Sample Community Posts & Notices');

    // 7. Complaints
    if (importedStudents.length > 0) {
      await Complaint.create({
        auth_id: importedStudents[0].auth_id, message: 'The ceiling fan in my room makes too much noise.',
        category: 'Hostel & Facilities'
      });
    }

    await WardenComplaint.create({
      title: 'Water supply issue', description: 'No water on the 3rd floor.',
      reporter: warden.name, role: 'staff', date: today, time: '10:00', location: '3rd Floor',
      status: 'OPEN', priority: 'High', creator: warden.userId, hostelName: warden.hostelName,
      timeline: { reportedDate: today, reportedTime: '10:00' }
    });
    console.log('🛠️ Created Sample Complaints');

    // 8. Teacher Schedules & Activities
    await TeacherSchedule.create({
      teacherId: teacher.userId, title: 'Maths Class', type: 'in_person', date: todayStr,
      startTime: '09:00', endTime: '10:00'
    });

    if (importedStudents.length > 0) {
      await Activity.insertMany([
        { id: 1, title: 'Morning Yoga', date: today, time: '06:00', location: 'Courtyard', description: 'Mandatory.', hostelName: hostels.kupwara._id, requestedBy: importedStudents[0].name, requesterRole: 'student', creator: importedStudents[0].userId, category: 'Sports' },
        { id: 2, title: 'Study Hour', date: today, time: '18:00', location: 'Library', description: 'Silent study.', hostelName: hostels.kupwara._id, requestedBy: warden.name, requesterRole: 'warden', creator: warden.userId, category: 'Academic' }
      ]);
    }

    await Expense.create({
      id: 1, amount: 1500, category: 'Food', description: 'Weekly vegetables',
      date: today, status: 'paid', hostelName: hostels.kupwara._id, creator: warden._id
    });
    console.log('📅 Created Schedules, Tasks, Activities, and Expenses');

    console.log('\n✅ Master Seeding Complete!');
    console.log('----------------------------------------------------');
    console.log('Sample Logins (Password: 123456):');
    if (importedStaff.wardens.length > 0) {
      const u = await User.findById(importedStaff.wardens[0].userId);
      console.log(`- WARDEN:  ${u.auth_id}`);
    }
    if (importedStaff.teachers.length > 0) {
      const u = await User.findById(importedStaff.teachers[0].userId);
      console.log(`- TEACHER: ${u.auth_id}`);
    }
    if (importedStudents.length > 0) {
      const u = await User.findById(importedStudents[0].userId);
      console.log(`- STUDENT: ${u.auth_id}`);
    }
    console.log('Check MongoDB for complete list of all users.');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
};

seedMaster();
