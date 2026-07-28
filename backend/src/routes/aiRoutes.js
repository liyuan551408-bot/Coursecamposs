const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// 定义一个 POST 路由，路径为 /test-embedding，交由 aiController 处理
router.post('/test-embedding', aiController.testEmbedding);

module.exports = router;