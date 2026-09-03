const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { aiRateLimit } = require('../middlewares/aiRateLimit');

router.use(aiRateLimit);
router.post('/test-embedding', verifyToken, requireRole('ADMIN'), aiController.testEmbedding);
router.post('/semantic-search', verifyToken, aiController.semanticSearch);
router.post('/recommend', verifyToken, aiController.aiRecommendCourses);
router.get('/courses/:id/summary', aiController.getCourseSummary);

module.exports = router;
