/** @file Maps saved course API endpoints to middleware and controller handlers. */
const express = require('express');
const router = express.Router();
const savedCourseController = require('../controllers/savedCourseController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Favorites are personal private data and must all pass Token verification
router.use(verifyToken, requireRole('STUDENT'));
router.post('/', savedCourseController.addCourse);
router.get('/', savedCourseController.getMyCourses);
router.delete('/:courseId', savedCourseController.removeCourse);

module.exports = router;
