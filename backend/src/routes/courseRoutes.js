const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// GET /api/courses:返回课程详情
router.get('/', courseController.getCourses);

// POST /api/courses:创建课程
router.post('/', courseController.createCourse);

// POST /api/courses/compare 
router.post('/compare', courseController.compareCourses);

// GET /api/courses/search: 高级搜索接口
router.get('/search', courseController.searchCourses);

// GET /api/courses/:id 
router.get('/:id', (req, res, next) => {
    // 检查参数是否只包含数字
    if (/^\d+$/.test(req.params.id)) {
        return courseController.getCourseById(req, res);
    }
    // 不是纯数字，放行到下一个匹配的路由
    next();
});
// GET /api/courses/:code - 用于获取单门课程详情
router.get('/:code', courseController.getCourseByCode);

module.exports = router;