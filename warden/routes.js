const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../auth/middleware');

const {
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
  updateWardenProfile
} = require('./controller');

// ===== WARDEN PROFILE =====
router.get(
  '/profile',
  authenticateToken,
  authorizeRoles('warden'),
  getWardenProfile
);

router.put(
  '/profile',
  authenticateToken,
  authorizeRoles('warden'),
  updateWardenProfile
);

// ===== STUDENTS =====

// CREATE
router.post(
  '/students',
  authenticateToken,
  authorizeRoles('warden'),
  createStudent
);

// GET ALL
router.get(
  '/students',
  authenticateToken,
  authorizeRoles('warden'),
  getStudents
);

// UPDATE
router.put(
  '/students/:studentId',
  authenticateToken,
  authorizeRoles('warden', 'admin'),
  updateStudent
);

// UPDATE LOGIN CREDENTIALS
router.put(
  '/students/:studentId/credentials',
  authenticateToken,
  authorizeRoles('warden', 'admin'),
  updateStudentCredentials
);

// DELETE
router.delete(
  '/students/:studentId',
  authenticateToken,
  authorizeRoles('warden'),
  deleteStudent
);

// ===== STAFF =====

// CREATE
router.post(
  '/staff',
  authenticateToken,
  authorizeRoles('warden'),
  createStaff
);

// GET ALL
router.get(
  '/staff',
  authenticateToken,
  authorizeRoles('warden'),
  getStaff
);

// UPDATE
router.put(
  '/staff/:staffId',
  authenticateToken,
  authorizeRoles('warden'),
  updateStaff
);

// UPDATE LOGIN CREDENTIALS
router.put(
  '/staff/:staffId/credentials',
  authenticateToken,
  authorizeRoles('warden'),
  updateStaffCredentials
);

// DELETE
router.delete(
  '/staff/:staffId',
  authenticateToken,
  authorizeRoles('warden'),
  deleteStaff
);

module.exports = router;
