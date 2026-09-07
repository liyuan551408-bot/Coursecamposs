/** @file Translates course HTTP requests into service calls and API responses. */
// Import methods provided by the service layer.
const courseService = require('../services/courseService');

// Handle requests to get all courses.
const getCourses = async (req, res) => {
    try {
        const courses = await courseService.getAllCourses();
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        console.error('Course list query failed:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Handle course creation.
const createCourse = async (req, res) => {
    try {
        const { name, code, credits, description, workloadHours, offeredSemesters,
            level, assessmentTypes, officialLink, prerequisiteIds } = req.body;

        if (!name || !code) {
            return res.status(400).json({ success: false, message: 'Course name and code are required' });
        }

        if (credits === undefined || credits === null || !Number.isInteger(Number(credits)) || Number(credits) <= 0) {
            return res.status(400).json({ success: false, message: 'Credits must be a positive whole number' });
        }

        if (prerequisiteIds !== undefined && (!Array.isArray(prerequisiteIds) || prerequisiteIds.some((id) => typeof id !== 'string' && !Number.isInteger(id)))) {
            return res.status(400).json({ success: false, message: 'Prerequisites must be entered as course IDs or course codes' });
        }

        const newCourse = await courseService.createCourse(
            { name, code, credits, description, workloadHours, offeredSemesters,
                level, assessmentTypes, officialLink },
            prerequisiteIds
        );
        res.status(201).json({ success: true, data: newCourse });
    } catch (error) {
        console.error('Course creation failed:', error);

        // Return actionable client errors for the constraints most commonly
        // encountered by the admin form instead of masking them as a 500.
        if (error?.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'A course with this code already exists' });
        }
        if (error?.code === 'P2025') {
            return res.status(400).json({ success: false, message: 'One or more prerequisite course IDs do not exist' });
        }
        if (error?.code === 'PREREQUISITE_NOT_FOUND') {
            return res.status(400).json({
                success: false,
                message: `Prerequisite courses not found: ${error.meta?.missing?.join(', ')}`
            });
        }
        res.status(500).json({ success: false, message: 'Server Error during course creation' });
    }
};

// Handle single-course lookup by ID.
const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await courseService.getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.status(200).json({ success: true, data: course });
    } catch (error) {
        console.error('Course lookup failed:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Handle single-course lookup by code.
const getCourseByCode = async (req, res) => {
    try {
        const course = await courseService.getCourseByCode(req.params.code);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        return res.status(200).json({ success: true, data: course });
    } catch (error) {
        if (error instanceof TypeError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('Get Course By Code Error:', error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Handle course comparison.
const compareCourses = async (req, res) => {
    try {
        const { courseIds } = req.body;
        if (!Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide an array of courseIds' });
        }
        const courses = await courseService.getCoursesByIds(courseIds);
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        console.error('Course comparison query failed:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Handle advanced course search.
const searchCourses = async (req, res) => {
    try {
        const courses = await courseService.searchCourses(req.query);

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Advanced search failed:', error);
        res.status(500).json({ success: false, message: 'Server Error during search' });
    }
};

// Handle course updates and refresh the course embedding.
const updateCourse = async (req, res) => {
    try {
        const updatedCourse = await courseService.updateCourse(req.params.id, req.body);
        res.status(200).json({ success: true, data: updatedCourse });
    } catch (error) {
        console.error('Course update failed:', error);
        res.status(500).json({ success: false, message: 'Server Error during course update' });
    }
};

module.exports = {
    getCourses,
    createCourse,
    updateCourse,
    getCourseById,
    getCourseByCode,
    compareCourses,
    searchCourses
};
