/** @file Maps review API endpoints to middleware and controller handlers. */
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const studentOnly = [verifyToken, requireRole('STUDENT')];
const moderationRoles = [verifyToken, requireRole('MODERATOR', 'ADMIN')];

// Public: approved reviews for a course
router.get('/course/:courseId', reviewController.getCourseReviews);

// Public: rating summary for a course
router.get('/course/:courseId/summary', reviewController.getCourseRatingSummary);

// Student: own review for a course, including non-public moderation states
router.get('/mine/course/:courseId', ...studentOnly, reviewController.getMyCourseReview);

// Student: submit a review
router.post('/', ...studentOnly, reviewController.addReview);

// Student: update own review (resets to PENDING)
router.put('/course/:courseId', ...studentOnly, reviewController.updateReview);

// Moderator or administrator: pending review queue
router.get('/pending', ...moderationRoles, reviewController.getPendingReviews);

// Moderator or administrator: pending report queue
router.get('/reports/pending', ...moderationRoles, reviewController.getPendingReports);
router.get('/moderation/counts', ...moderationRoles, reviewController.getModerationQueueCounts);
router.patch('/reports/:id/status', ...moderationRoles, reviewController.updateReportStatus);

// Student: report a review
router.post('/:id/report', ...studentOnly, reviewController.reportReview);

// Moderator or administrator: moderate a review
router.patch('/:id/status', ...moderationRoles, reviewController.moderateReview);

module.exports = router;
