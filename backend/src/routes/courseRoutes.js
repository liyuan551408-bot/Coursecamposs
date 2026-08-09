const express = require('express');
const router = express.Router();

// 引入 Controller
const courseController = require('../controllers/courseController');

// 定义 GET /api/courses 路由，并交给 getCourses 函数处理
router.get('/', courseController.getCourses);

// POST /api/courses - 创建课程
router.post('/', courseController.createCourse);

// GET /api/courses/:id - 获取课程详情
router.get('/:id', courseController.getCourseById);

module.exports = router;