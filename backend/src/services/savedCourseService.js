const prisma = require('../lib/prisma');

// 1. addSavedCourse
const addSavedCourse = async (userId, courseId) => {
    return prisma.savedCourse.create({
        data: {
            userId: Number(userId),
            courseId: Number(courseId)
        },
        include: { 
            course: {
                select: { id: true, code: true, name: true, credits: true, level: true }
            } 
        }
    });
};

// 2. obtain all saved courses for the current user
const getMySavedCourses = async (userId) => {
    return prisma.savedCourse.findMany({
        where: { userId: Number(userId) },
        include: {
            course: {
                select: { 
                    id: true, 
                    code: true, 
                    name: true, 
                    credits: true, 
                    level: true,
                    offeredSemesters: true 
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

// 3. cancel saved course
const removeSavedCourse = async (userId, courseId) => {
    return prisma.savedCourse.delete({
        where: {
            userId_courseId: {
                userId: Number(userId),
                courseId: Number(courseId)
            }
        }
    });
};

module.exports = {
    addSavedCourse,
    getMySavedCourses,
    removeSavedCourse
};