/** @file Translates plan HTTP requests into service calls and API responses. */
const plannerService = require('../services/planService');

// Create a semester plan for the verified user.
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
        // Surface the composite uniqueness rule as a client-friendly conflict.
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'A plan with this name already exists for this semester' });
        }
        console.error('Create Plan Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Return all plans owned by the verified user.
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

// Add a course to a plan owned by the verified user.
const addCourse = async (req, res) => {
    try {
        const userId = req.user.id; // Never trust a user id supplied in the request body.
        const planId = req.params.planId;
        const { courseId } = req.body; 

        if (!courseId) {
            return res.status(400).json({ success: false, message: 'courseId is required' });
        }

        // Pass ownership context into the service for authorization-aware persistence.
        const result = await plannerService.addCourseToPlan(userId, planId, courseId);
        
        res.status(201).json({ 
            success: true, 
            message: 'Course added to plan', 
            warnings: result.warnings, // Keep prerequisite warnings separate from the saved entity.
            data: result.course // Return the created plan-course record as the primary payload.
        });
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