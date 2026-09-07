/** @file Maps ai API endpoints to middleware and controller handlers. */
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { aiRateLimit } = require('../middlewares/aiRateLimit');

// Authenticate before applying the per-user AI rate limit so req.user is
// available and requests from different users are not incorrectly grouped.
router.use(verifyToken);
router.use(aiRateLimit);
router.post('/test-embedding', requireRole('ADMIN'), aiController.testEmbedding);
router.post('/semantic-search', aiController.semanticSearch);
router.post('/recommend', aiController.aiRecommendCourses);
router.post('/compare', aiController.compareCoursesWithAi);
router.get('/courses/:id/summary', aiController.getCourseSummary);

module.exports = router;
