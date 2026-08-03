const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/test-embedding', aiController.testEmbedding);
router.post('/semantic-search', aiController.semanticSearch);
router.post('/recommend', aiController.aiRecommendCourses);

module.exports = router;