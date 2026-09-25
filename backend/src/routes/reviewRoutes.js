/** @file Maps review API endpoints to middleware and controller handlers. */
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const studentOnly = [verifyToken, requireRole('STUDENT')];
const moderatorOnly = [verifyToken, requireRole('MODERATOR')];

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

// Moderator: pending review queue
router.get('/pending', ...moderatorOnly, reviewController.getPendingReviews);

// Moderator: pending report queue
router.get('/reports/pending', ...moderatorOnly, reviewController.getPendingReports);
router.get('/moderation/counts', ...moderatorOnly, reviewController.getModerationQueueCounts);
router.patch('/reports/:id/status', ...moderatorOnly, reviewController.updateReportStatus);

// Student: report a review
router.post('/:id/report', ...studentOnly, reviewController.reportReview);

// Moderator: moderate a review
router.patch('/:id/status', ...moderatorOnly, reviewController.moderateReview);

module.exports = router;
