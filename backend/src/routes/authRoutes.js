/** @file Maps auth API endpoints to middleware and controller handlers. */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { forgotPasswordLimiter, resetPasswordLimiter } = require('../middlewares/rateLimit');

// Only route suffixes are defined here.
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);

module.exports = router;
