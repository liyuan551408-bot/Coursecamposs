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

module.exports = {
    getCourses
};