
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 现在的路径只写后缀
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;