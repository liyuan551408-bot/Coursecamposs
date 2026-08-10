const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 排课计划属于极其隐私的个人数据，全部必须拦截校验 Token
router.post('/', verifyToken, planController.createPlan);
router.get('/', verifyToken, planController.getMyPlans);
router.post('/:planId/courses', verifyToken, planController.addCourse);

module.exports = router;