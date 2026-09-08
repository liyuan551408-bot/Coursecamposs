/** @file Maps authenticated completed-course endpoints. */
const express = require('express');
const controller = require('../controllers/completedCourseController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(verifyToken);
router.get('/', controller.getMyCompletedCourses);
router.put('/', controller.markCourseCompleted);
router.delete('/:courseId', controller.unmarkCourseCompleted);

module.exports = router;
