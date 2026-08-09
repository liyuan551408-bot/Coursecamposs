const prisma = require('../lib/prisma');

const courseSelect = {
    id: true,
    code: true,
    name: true,
    description: true,
    credits: true,
    workloadHours: true,
    isActive: true,
    createdAt: true,
    updatedAt: true
};

const getAllCourses = async ({ skip = 0, take = 50 } = {}) => {
    const safeSkip = Number.isInteger(skip) && skip >= 0 ? skip : 0;
    const safeTake = Number.isInteger(take) && take > 0 ? Math.min(take, 100) : 50;

    return prisma.course.findMany({
        where: { isActive: true },
        select: courseSelect,
        orderBy: { code: 'asc'},
        skip: safeSkip,
        take: safeTake
    });
};

// 【新增】1. 创建课程（支持绑定先决条件）
const createCourse = async (courseData, prerequisiteIds = []) => {
    const data = {
        name: courseData.name,
        code: courseData.code,
        credits: courseData.credits,
        description: courseData.description,
        workloadHours: courseData.workloadHours
    };

    // 如果传入了先决课程的 ID 数组，使用 connect 关联
    if (prerequisiteIds && prerequisiteIds.length > 0) {
        data.prerequisites = {
            connect: prerequisiteIds.map(id => ({ id: Number(id) }))
        };
    }

    return prisma.course.create({
        data,
        // 这里为了能返回关联数据，我们直接包含前置课程字段
        include: {
            prerequisites: true 
        }
    });
};

// 【新增】2. 根据 ID 获取单门课程详情（带出它需要的前置课程）
const getCourseById = async (id) => {
    return prisma.course.findUnique({
        where: { id: Number(id) },
        include: {
            prerequisites: true,     // 查出学这门课前必须要修的课
            prerequisiteFor: true    // 查出这门课是哪些高级课的先决条件
        }
    });
};

module.exports = {
    getAllCourses,
    createCourse,
    getCourseById
};