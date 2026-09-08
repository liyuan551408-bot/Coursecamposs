/** @file Maps plan API endpoints to middleware and controller handlers. */
const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Every planner endpoint requires authentication because schedules are private user data.
router.post('/', verifyToken, planController.createPlan);
router.get('/', verifyToken, planController.getMyPlans);
router.post('/:planId/courses', verifyToken, planController.addCourse);
router.delete('/:planId/courses/:courseId', verifyToken, planController.removeCourse);
router.delete('/:planId', verifyToken, planController.deletePlan);

module.exports = router;
