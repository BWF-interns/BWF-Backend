const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../auth/middleware');

const { createStudent , getWardenProfile } = require('./controller');

// Warden creates student
router.post(
  '/create-student',
  authenticateToken,
  authorizeRoles('warden'),
  createStudent
);


router.get(
  '/profile',
  authenticateToken,
  authorizeRoles('warden'),
  getWardenProfile
);
module.exports = router;