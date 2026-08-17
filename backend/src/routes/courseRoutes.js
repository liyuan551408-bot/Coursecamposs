const express = require('express');
const router = express.Router();

// 引入 Controller
const courseController = require('../controllers/courseController');

// 定义 GET /api/courses 路由，并交给 getCourses 函数处理
router.get('/', courseController.getCourses);

// 定义 GET /api/courses/:code 路由，用于获取单门课程详情
router.get('/:code', courseController.getCourseByCode);

module.exports = router;
