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

// 根据课程代码获取课程详情和已审核评价
const getCourseByCode = async (req, res) => {
    try {
        const course = await courseService.getCourseByCode(req.params.code);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        if (error instanceof TypeError) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        console.error('Get Course By Code Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    getCourses,
    getCourseByCode
};
