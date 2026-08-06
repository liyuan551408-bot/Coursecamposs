const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 引入我们刚刚写的“保安”
const { verifyToken } = require('../middlewares/authMiddleware');

// 定义路由，像三明治一样把 verifyToken 夹在中间
// 任何请求打到 /me，都会先经过 verifyToken 检查
router.get('/me', verifyToken, userController.getMe);
router.patch('/me', verifyToken, userController.updateProfile);

module.exports = router;