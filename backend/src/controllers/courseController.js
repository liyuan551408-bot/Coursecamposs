// Import methods provided by the service layer.
const courseService = require('../services/courseService');

// Handle requests to get all courses.
const getCourses = async (req, res) => {
    try {
        // Fetch data from the database layer.
        const courses = await courseService.getAllCourses();
        // Return a successful JSON response.
        res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        // Unified error handling.
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    getCourses
};
