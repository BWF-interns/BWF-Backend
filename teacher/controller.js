const User = require("../models/User");
const {
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
} = require("./service");

function ensureString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function getTeacherDashboard(req, res) {
  try {
    const students = await getAssignedStudents(req.user.auth_id);
    const resources = await listGlobalResources();
    const submissions = await getSubmissionsForMentor(req.user.auth_id, "pending");

    return res.status(200).json({
      students,
      resources,
      pendingSubmissions: submissions,
    });
  } catch (err) {
    console.error("TEACHER DASHBOARD ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function assignMentor(req, res) {
  try {
    const { student_auth_id } = req.params;
    const mentorAuthId = req.body.mentorAuthId || req.user.auth_id;
    const mentorName = req.body.mentorName || req.user.auth_id;

    if (!ensureString(student_auth_id)) {
      return res.status(400).json({ message: "student_auth_id is required" });
    }

    const result = await assignMentorToStudent(
      student_auth_id,
      mentorAuthId,
      mentorName,
      req.user.auth_id
    );
    return res.status(200).json(result);
  } catch (err) {
    console.error("ASSIGN MENTOR ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function addAssignment(req, res) {
  try {
    const { student_auth_id } = req.params;
    const { title, subject, dueDate, priority } = req.body;

    if (!ensureString(title) || !ensureString(subject) || !ensureString(dueDate)) {
      return res.status(400).json({ message: "title, subject and dueDate are required" });
    }

    const created = await createAssignmentForStudent(student_auth_id, {
      title,
      subject,
      dueDate,
      priority,
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error("ADD ASSIGNMENT ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function addSchedule(req, res) {
  try {
    const { student_auth_id } = req.params;
    const { title, sessionType, date, startTime, joinLink } = req.body;

    if (!ensureString(title) || !ensureString(date) || !ensureString(startTime)) {
      return res.status(400).json({ message: "title, date and startTime are required" });
    }

    const created = await createScheduleForStudent(student_auth_id, {
      title,
      sessionType,
      date,
      startTime,
      joinLink,
    });
    return res.status(201).json(created);
  } catch (err) {
    console.error("ADD SCHEDULE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function pushMentorNote(req, res) {
  try {
    const { student_auth_id } = req.params;
    const { message, mentorName } = req.body;

    if (!ensureString(message)) {
      return res.status(400).json({ message: "message is required" });
    }

    const note = await createMentorNote(
      student_auth_id,
      mentorName || req.user.auth_id,
      message
    );
    return res.status(201).json(note);
  } catch (err) {
    console.error("PUSH MENTOR NOTE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function updateResource(req, res) {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!["library", "syllabus", "contactMentor"].includes(key)) {
      return res.status(400).json({ message: "Invalid resource key" });
    }
    if (!ensureString(value)) {
      return res.status(400).json({ message: "value is required" });
    }

    const resource = await upsertGlobalResource(key, value);
    return res.status(200).json(resource);
  } catch (err) {
    console.error("UPDATE RESOURCE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getResources(req, res) {
  try {
    const resources = await listGlobalResources();
    return res.status(200).json(resources);
  } catch (err) {
    console.error("GET RESOURCES ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function submitAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const { studentAuthId, submissionText } = req.body;

    if (!ensureString(studentAuthId) || !ensureString(submissionText)) {
      return res.status(400).json({ message: "studentAuthId and submissionText are required" });
    }

    const created = await createSubmission(assignmentId, studentAuthId, submissionText);
    return res.status(201).json(created);
  } catch (err) {
    console.error("SUBMIT ASSIGNMENT ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getSubmissions(req, res) {
  try {
    const { status } = req.query;
    const submissions = await getSubmissionsForMentor(req.user.auth_id, status);
    return res.status(200).json(submissions);
  } catch (err) {
    console.error("GET SUBMISSIONS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function reviewStudentSubmission(req, res) {
  try {
    const { submissionId } = req.params;
    const { status, rejectionNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be approved or rejected" });
    }
    if (status === "rejected" && !ensureString(rejectionNote || "")) {
      return res.status(400).json({ message: "rejectionNote is required for rejected submissions" });
    }

    const updated = await reviewSubmission(submissionId, req.user.auth_id, status, rejectionNote);
    if (!updated) {
      return res.status(404).json({ message: "Submission not found" });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error("REVIEW SUBMISSION ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getTeacherProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      name: user.name,
      auth_id: user.auth_id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      bio: user.bio || undefined,
      profilePic: user.profilePic || undefined,
      programName: "General",
    });
  } catch (err) {
    console.error("TEACHER PROFILE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getPerformanceOverview(req, res) {
  try {
    const { student_auth_id } = req.params;
    const overview = await getStudentOverview(student_auth_id);
    return res.status(200).json(overview);
  } catch (err) {
    console.error("STUDENT OVERVIEW ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getAssignmentProgress(req, res) {
  try {
    const { student_auth_id } = req.params;
    const progress = await getStudentAssignmentProgress(student_auth_id);
    return res.status(200).json(progress);
  } catch (err) {
    console.error("ASSIGNMENT PROGRESS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getTeacherDashboard,
  getTeacherProfile,
  assignMentor,
  addAssignment,
  addSchedule,
  pushMentorNote,
  updateResource,
  getResources,
  submitAssignment,
  getSubmissions,
  reviewStudentSubmission,
  getPerformanceOverview,
  getAssignmentProgress,
};
