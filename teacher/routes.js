const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../auth/middleware");
const {
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
} = require("./controller");

router.use(authenticateToken, authorizeRoles("teacher", "admin"));

router.get("/dashboard", getTeacherDashboard);
router.get("/profile", getTeacherProfile);
router.get("/resources", getResources);
router.put("/resources/:key", updateResource);

router.put("/students/:student_auth_id/mentor", assignMentor);
router.post("/students/:student_auth_id/assignments", addAssignment);
router.post("/students/:student_auth_id/schedule", addSchedule);
router.post("/students/:student_auth_id/mentor-note", pushMentorNote);
router.get("/students/:student_auth_id/overview", getPerformanceOverview);
router.get("/students/:student_auth_id/assignment-progress", getAssignmentProgress);

router.post("/assignments/:assignmentId/submissions", submitAssignment);
router.get("/submissions", getSubmissions);
router.patch("/submissions/:submissionId/review", reviewStudentSubmission);

module.exports = router;
