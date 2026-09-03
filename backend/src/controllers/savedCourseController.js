const savedCourseService = require('../services/savedCourseService');

// 添加收藏
const addCourse = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({ success: false, message: 'courseId is required' });
        }

        const saved = await savedCourseService.addSavedCourse(userId, courseId);
        res.status(201).json({ success: true, data: saved });
    } catch (error) {
        // Prisma Joint primary key conflict error code: indicates the course has already been bookmarked.
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Course already saved' });
        }
        console.error('Add Saved Course Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// obtained from the service
const getMyCourses = async (req, res) => {
    try {
        const courses = await savedCourseService.getMySavedCourses(req.user.id);
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        console.error('Get Saved Courses Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// cancel saved course
const removeCourse = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        await savedCourseService.removeSavedCourse(userId, courseId);
        res.status(200).json({ success: true, message: 'Course removed from saved list' });
    } catch (error) {
        
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Saved course not found' });
        }
        console.error('Remove Saved Course Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    addCourse,
    getMyCourses,
    removeCourse
};