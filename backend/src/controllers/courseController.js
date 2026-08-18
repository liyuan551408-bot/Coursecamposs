// 引入 service 层提供的方法
const courseService = require('../services/courseService');

// 处理获取所有课程的请求
const getCourses = async (req, res) => {
    try {
        // 调用数据库层拿数据
        const courses = await courseService.getAllCourses();
        // 返回成功的 JSON 响应
        res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        // 统一的错误处理
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// 处理创建课程的逻辑
const createCourse = async (req, res) => {
    try {
        const { name, code, credits, description, workloadHours, prerequisiteIds } = req.body;
        
        // 简单的数据校验
        if (!name || !code) {
            return res.status(400).json({ success: false, message: 'Course name and code are required' });
        }

        // 调用 Service 层处理数据库逻辑
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

// 处理获取单门课程的逻辑
const getCourseById = async (req, res) => {
    try {
        const courseId = req.params.id; // 从 URL 获取 ID

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

module.exports = {
    getCourses,
    createCourse,
    getCourseById
};