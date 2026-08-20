// 引入 service 层提供的方法
const courseService = require('../services/courseService');

// 处理获取所有课程的请求
const getCourses = async (req, res) => {
    try {
        const courses = await courseService.getAllCourses();
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 处理创建课程的逻辑
const createCourse = async (req, res) => {
    try {
        const { name, code, credits, description, workloadHours, prerequisiteIds } = req.body;
        
        if (!name || !code) {
            return res.status(400).json({ success: false, message: 'Course name and code are required' });
        }

        const newCourse = await courseService.createCourse(
            { name, code, credits, description, workloadHours }, 
            prerequisiteIds
        );
        res.status(201).json({ success: true, data: newCourse });
    } catch (error) {
        console.error("创建课程失败:", error);
        res.status(500).json({ success: false, message: 'Server Error during course creation' });
    }
};

// 处理获取单门课程的逻辑 (按 ID)
const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.id; 
        const course = await courseService.getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.status(200).json({ success: true, data: course });
    } catch (error) {
        console.error("获取课程失败:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 根据课程代码获取课程详情 (队友新增)
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

// 处理多课程对比的逻辑
const compareCourses = async (req, res) => {
    try {
        const { courseIds } = req.body;
        if (!Array.isArray(courseIds) || courseIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide an array of courseIds' });
        }
        const courses = await courseService.getCoursesByIds(courseIds);
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        console.error("批量查询对比课程失败:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// 处理高级搜索的请求
const searchCourses = async (req, res) => {
    try {
        // req.query 会自动提取 URL 中的参数，例如 ?keyword=java&level=200
        const courses = await courseService.searchCourses(req.query);
        
        res.status(200).json({ 
            success: true, 
            count: courses.length, // 返回总数方便前端分页或展示
            data: courses 
        });
    } catch (error) {
        console.error("Advanced search failed:", error);
        res.status(500).json({ success: false, message: 'Server Error during search' });
    }
};

module.exports = {
    getCourses,
    createCourse,
    getCourseById,
    getCourseByCode,
    compareCourses,
    searchCourses
};