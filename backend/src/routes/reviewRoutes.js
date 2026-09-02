const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const moderatorOrAdmin = [verifyToken, requireRole('ADMIN', 'MODERATOR')];

// Public: approved reviews for a course
router.get('/course/:courseId', reviewController.getCourseReviews);

// Public: rating summary for a course
router.get('/course/:courseId/summary', reviewController.getCourseRatingSummary);

// Student: submit a review
router.post('/', verifyToken, reviewController.addReview);

// Student: update own review (resets to PENDING)
router.put('/course/:courseId', verifyToken, reviewController.updateReview);

// Moderator/Admin: pending review queue
router.get('/pending', ...moderatorOrAdmin, reviewController.getPendingReviews);

// Moderator/Admin: pending report queue
router.get('/reports/pending', ...moderatorOrAdmin, reviewController.getPendingReports);

// Student: report a review
router.post('/:id/report', verifyToken, reviewController.reportReview);

// Moderator/Admin: moderate a review
router.patch('/:id/status', ...moderatorOrAdmin, reviewController.moderateReview);

module.exports = router;
