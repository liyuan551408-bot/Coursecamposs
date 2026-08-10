const plannerService = require('../services/planService');

// 创建新计划
const createPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, year, semester } = req.body;

        if (!name || !year || !semester) {
            return res.status(400).json({ success: false, message: 'Name, year, and semester are required' });
        }

        const plan = await plannerService.createPlan(userId, req.body);
        res.status(201).json({ success: true, message: 'Plan created successfully', data: plan });
    } catch (error) {
        // 你在 schema 里写了 @@unique([userId, year, semester, name])，非常严谨
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'A plan with this name already exists for this semester' });
        }
        console.error('Create Plan Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 获取我的所有计划
const getMyPlans = async (req, res) => {
    try {
        const userId = req.user.id;
        const plans = await plannerService.getUserPlans(userId);
        res.status(200).json({ success: true, data: plans });
    } catch (error) {
        console.error('Get Plans Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 往计划里添加课程
const addCourse = async (req, res) => {
    try {
        const planId = req.params.planId;
        const { courseId } = req.body; // 从请求体里获取要添加的课程 ID

        if (!courseId) {
            return res.status(400).json({ success: false, message: 'courseId is required' });
        }

        const addedCourse = await plannerService.addCourseToPlan(planId, courseId);
        res.status(201).json({ success: true, message: 'Course added to plan', data: addedCourse });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'This course is already in the plan' });
        }
        console.error('Add Course Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    createPlan,
    getMyPlans,
    addCourse
};