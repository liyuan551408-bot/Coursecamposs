const express = require('express');
const router = express.Router();

// Import the course controller.
const courseController = require('../controllers/courseController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// GET /api/courses: return all courses.
router.get('/', courseController.getCourses);

// POST /api/courses: create a course.
router.post('/', verifyToken, requireRole('ADMIN'), courseController.createCourse);
router.patch('/:id', verifyToken, requireRole('ADMIN'), courseController.updateCourse);

// POST /api/courses/compare: compare courses.
router.post('/compare', courseController.compareCourses);

// GET /api/courses/search: advanced search.
router.get('/search', courseController.searchCourses);

// GET /api/courses/:id: return a course by numeric ID.
router.get('/:id', (req, res, next) => {
    // Only numeric parameters are treated as IDs.
    if (/^\d+$/.test(req.params.id)) {
        return courseController.getCourseById(req, res);
    }
    // Non-numeric parameters are handled by the course-code route.
    next();
});

// GET /api/courses/:code: return a course by code.
router.get('/:code', courseController.getCourseByCode);

module.exports = router;
