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

// 往指定的计划里添加一门课,并检测先觉条件
const addCourseToPlan = async (userId, planId, courseId) => {
    // 获取这门课以及它的先决条件
    const course = await prisma.course.findUnique({
        where: { id: Number(courseId) },
        include: { prerequisites: true }
    });

    if (!course) throw new Error('Course not found');

    let warnings = [];

    // 有先决条件
    if (course.prerequisites.length > 0) {
        // 取用户【已经修完】的课程 ID 列表
        const completed = await prisma.completedCourse.findMany({
            where: { userId: Number(userId) }
        });
        const completedIds = completed.map(c => c.courseId);

        // 获取用户在【所有计划】中已添加的课程 ID 列表
        const planned = await prisma.planCourse.findMany({
            where: { plan: { userId: Number(userId) } }
        });
        const plannedIds = planned.map(p => p.courseId);

        // 滤出那些既没有完成，也没有在计划中的先决条件
        const missingPrereqs = course.prerequisites.filter(p => 
            !completedIds.includes(p.id) && !plannedIds.includes(p.id)
        );

        if (missingPrereqs.length > 0) {
            const missingCodes = missingPrereqs.map(p => p.code).join(', ');
            warnings.push(`Warning: You may be missing prerequisites for this course: ${missingCodes}`);
        }
    }

    // 把课正常加进计划
    const addedCourse = await prisma.planCourse.create({
        data: {
            planId: Number(planId),
            courseId: Number(courseId)
        },
        include: {
            course: true // 返回课程详细信息
        }
    });

    // 把警告信息打包和数据一起返回给 Controller
    return {
        ...addedCourse,
        warnings 
    };
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