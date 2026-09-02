const express = require('express');
const router = express.Router();
const savedCourseController = require('../controllers/savedCourseController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Favorites are personal private data and must all pass Token verification
router.post('/', verifyToken, savedCourseController.addCourse);
router.get('/', verifyToken, savedCourseController.getMyCourses);
router.delete('/:courseId', verifyToken, savedCourseController.removeCourse);

module.exports = router;