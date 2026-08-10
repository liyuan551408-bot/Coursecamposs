const prisma = require('../lib/prisma');

// 创建一个新的学期计划
const createPlan = async (userId, data) => {
    return prisma.semesterPlan.create({
        data: {
            userId: Number(userId),
            name: data.name,
            year: Number(data.year),
            semester: data.semester
        }
    });
};

// 获取某用户所有的学期计划（连带查出计划里包含了哪些课）
const getUserPlans = async (userId) => {
    return prisma.semesterPlan.findMany({
        where: { userId: Number(userId) },
        include: {
            // 先查出关联表 planCourses，再查出关联表里的 course 详情
            planCourses: {
                include: {
                    course: true 
                }
            }
        },
        orderBy: [
            { year: 'desc' },
            { semester: 'desc' }
        ]
    });
};

// 往指定的计划里添加一门课
const addCourseToPlan = async (planId, courseId) => {
    return prisma.planCourse.create({
        data: {
            planId: Number(planId),
            courseId: Number(courseId)
        },
        include: {
            course: true // 返回刚加进去的那门课的信息
        }
    });
};

// 从计划里移除一门课
const removeCourseFromPlan = async (planId, courseId) => {
    return prisma.planCourse.delete({
        where: {
            planId_courseId: {
                planId: Number(planId),
                courseId: Number(courseId)
            }
        }
    });
};

module.exports = {
    createPlan,
    getUserPlans,
    addCourseToPlan,
    removeCourseFromPlan
};