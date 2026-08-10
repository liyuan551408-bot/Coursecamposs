const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// GET /api/courses:返回课程详情
router.get('/', courseController.getCourses);

// POST /api/courses:创建课程
router.post('/', courseController.createCourse);

// GET /api/courses/:id:获取课程详情
router.get('/:id', courseController.getCourseById);

router.post('/compare',courseController.compareCourses);

module.exports = router;