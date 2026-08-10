const reviewService = require('../services/reviewService');

// 学生提交评价
const addReview = async (req, res) => {
    try {
        const userId = req.user.id; // 从 JWT Token 中解析出来的用户 ID
        const { courseId, overallRating, difficultyRating, workloadRating, comment } = req.body;

        // 基础数据校验
        if (!courseId || !overallRating || !difficultyRating || !workloadRating) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const review = await reviewService.createReview(userId, courseId, req.body);
        
        res.status(201).json({ 
            success: true, 
            message: 'Review submitted successfully and is pending approval',
            data: review 
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ 
                success: false, 
                message: 'You have already reviewed this course' 
            });
        }
        console.error('Add Review Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 获取课程评价
const getCourseReviews = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const reviews = await reviewService.getApprovedReviewsByCourse(courseId);
        
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error('Get Reviews Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 管理员/协管员审核评价
const moderateReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { status } = req.body;

        // 简单的角色权限校验
        if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
            return res.status(403).json({ success: false, message: 'Access denied: Requires Moderator or Admin role' });
        }

        const updatedReview = await reviewService.updateReviewStatus(reviewId, status);
        
        res.status(200).json({ success: true, message: `Review status updated to ${status}`, data: updatedReview });
    } catch (error) {
        console.error('Moderate Review Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    addReview,
    getCourseReviews,
    moderateReview
};