const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. 获取某门课的评价 
router.get('/course/:courseId', reviewController.getCourseReviews);

// 2. 学生提交评价 (必须登录)
router.post('/', verifyToken, reviewController.addReview);

// 3. 管理员审核评价 ()
router.patch('/:id/status', verifyToken, reviewController.moderateReview);

module.exports = router;