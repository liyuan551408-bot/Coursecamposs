/** @file Maps user API endpoints to middleware and controller handlers. */
const express = require('express');
const router = express.Router();

// Import the user controller and authentication middleware.
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Both profile endpoints require token verification.
router.get('/me', verifyToken, userController.getMe);
router.patch('/me', verifyToken, userController.updateProfile);

module.exports = router;
