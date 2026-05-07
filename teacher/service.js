const Assignment = require("../student/models/assignment");
const Schedule = require("../student/models/schedule");
const MentorNote = require("../student/models/mentorNote");
const GlobalResource = require("../student/models/GlobalResource");
const Student = require("../student/models/student");
const MoodLog = require("../student/models/moodLog");
const Journal = require("../student/models/journal");
const MentorAssignment = require("./models/MentorAssignment");
const AssignmentSubmission = require("./models/AssignmentSubmission");

async function getAssignedStudents(mentorAuthId) {
  const links = await MentorAssignment.find({ mentor_auth_id: mentorAuthId }).lean();
  const studentIds = links.map((l) => l.student_auth_id);
  const students = await Student.find({ auth_id: { $in: studentIds } })
    .select("auth_id name class")
    .lean();

  return students;
}

async function assignMentorToStudent(studentAuthId, mentorAuthId, mentorName, assignedBy) {
  return MentorAssignment.findOneAndUpdate(
    { student_auth_id: studentAuthId },
    {
      mentor_auth_id: mentorAuthId,
      mentor_name: mentorName,
      assigned_by: assignedBy,
      last_modified: new Date(),
    },
    { upsert: true, new: true }
  );
}

async function createAssignmentForStudent(studentAuthId, payload) {
  return Assignment.create({
    auth_id: studentAuthId,
    title: payload.title,
    subject: payload.subject,
    dueDate: payload.dueDate,
    priority: payload.priority || "medium",
    last_modified: new Date(),
    is_synced: true,
  });
}

async function createScheduleForStudent(studentAuthId, payload) {
  return Schedule.create({
    auth_id: studentAuthId,
    title: payload.title,
    sessionType: payload.sessionType || "class",
    date: payload.date,
    startTime: payload.startTime,
    joinLink: payload.joinLink || null,
    last_modified: new Date(),
    is_synced: true,
  });
}

async function createMentorNote(studentAuthId, mentorName, message) {
  return MentorNote.create({
    auth_id: studentAuthId,
    mentorName,
    message,
    thanked: false,
    last_modified: new Date(),
    is_synced: true,
  });
}

async function upsertGlobalResource(key, value) {
  return GlobalResource.findOneAndUpdate(
    { key },
    { value, last_modified: new Date() },
    { upsert: true, new: true }
  );
}

async function listGlobalResources() {
  return GlobalResource.find({}).lean();
}

async function createSubmission(assignmentId, studentAuthId, submissionText) {
  return AssignmentSubmission.create({
    assignment_id: assignmentId,
    student_auth_id: studentAuthId,
    submissionText,
    status: "pending",
    rejectionNote: "",
    submitted_at: new Date(),
    last_modified: new Date(),
  });
}

async function getSubmissionsForMentor(mentorAuthId, status) {
  const links = await MentorAssignment.find({ mentor_auth_id: mentorAuthId }).lean();
  const studentIds = links.map((l) => l.student_auth_id);
  const query = { student_auth_id: { $in: studentIds } };

  if (status) {
    query.status = status;
  }

  return AssignmentSubmission.find(query)
    .populate("assignment_id")
    .sort({ createdAt: -1 })
    .lean();
}

async function reviewSubmission(submissionId, reviewerAuthId, status, rejectionNote) {
  return AssignmentSubmission.findByIdAndUpdate(
    submissionId,
    {
      status,
      rejectionNote: status === "rejected" ? rejectionNote || "" : "",
      reviewed_by: reviewerAuthId,
      reviewed_at: new Date(),
      last_modified: new Date(),
    },
    { new: true }
  );
}

async function getStudentOverview(studentAuthId) {
  const [student, assignments, submissions, moods, journals] = await Promise.all([
    Student.findOne({ auth_id: studentAuthId }).select("auth_id name class").lean(),
    Assignment.find({ auth_id: studentAuthId }).sort({ dueDate: -1 }).limit(10).lean(),
    AssignmentSubmission.find({ student_auth_id: studentAuthId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    MoodLog.find({ auth_id: studentAuthId }).sort({ date: -1 }).limit(15).lean(),
    Journal.find({ auth_id: studentAuthId }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return { student, assignments, submissions, moods, journals };
}

async function getStudentAssignmentProgress(studentAuthId) {
  const assignments = await Assignment.find({ auth_id: studentAuthId })
    .sort({ dueDate: 1 })
    .lean();

  const assignmentIds = assignments.map((item) => item._id);
  const submissions = await AssignmentSubmission.find({
    assignment_id: { $in: assignmentIds },
    student_auth_id: studentAuthId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const submissionByAssignment = new Map();
  submissions.forEach((submission) => {
    const key = String(submission.assignment_id);
    if (!submissionByAssignment.has(key)) {
      submissionByAssignment.set(key, submission);
    }
  });

  const progress = assignments.map((assignment) => {
    const submission = submissionByAssignment.get(String(assignment._id));
    const progressStatus = submission ? submission.status : "not_submitted";
    return {
      assignment_id: assignment._id,
      title: assignment.title,
      subject: assignment.subject,
      dueDate: assignment.dueDate,
      priority: assignment.priority,
      progressStatus,
      rejectionNote: submission?.rejectionNote || "",
      submittedAt: submission?.submitted_at || null,
      reviewedAt: submission?.reviewed_at || null,
    };
  });

  const summary = {
    total: progress.length,
    not_submitted: progress.filter((item) => item.progressStatus === "not_submitted").length,
    pending: progress.filter((item) => item.progressStatus === "pending").length,
    approved: progress.filter((item) => item.progressStatus === "approved").length,
    rejected: progress.filter((item) => item.progressStatus === "rejected").length,
  };

  return {
    student_auth_id: studentAuthId,
    summary,
    assignments: progress,
  };
}

module.exports = {
  getAssignedStudents,
  assignMentorToStudent,
  createAssignmentForStudent,
  createScheduleForStudent,
  createMentorNote,
  upsertGlobalResource,
  listGlobalResources,
  createSubmission,
  getSubmissionsForMentor,
  reviewSubmission,
  getStudentOverview,
  getStudentAssignmentProgress,
};
