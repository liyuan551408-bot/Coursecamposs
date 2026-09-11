/** @file Implements saved course business rules and persistence operations. */
const prisma = require('../lib/prisma');
const { createNotificationsSafely } = require('./notificationService');

// 1. addSavedCourse
const addSavedCourse = async (userId, courseId) => {
    const saved = await prisma.savedCourse.create({
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
    await createNotificationsSafely([userId], {
        type: 'SAVED_COURSE_ADDED',
        title: 'Course saved',
        message: `${saved.course.code} was added to your saved courses.`
    });
    return saved;
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
                    offeredSemesters: true,
                    assessmentTypes: true,
                    description: true,
                    workloadHours: true,
                    officialLink: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

// 3. cancel saved course
const removeSavedCourse = async (userId, courseId) => {
    const saved = await prisma.savedCourse.findUnique({
        where: { userId_courseId: { userId: Number(userId), courseId: Number(courseId) } },
        include: { course: { select: { code: true } } }
    });
    const removed = await prisma.savedCourse.delete({
        where: {
            userId_courseId: {
                userId: Number(userId),
                courseId: Number(courseId)
            }
        }
    });
    await createNotificationsSafely([userId], {
        type: 'SAVED_COURSE_REMOVED',
        title: 'Course removed from saved list',
        message: `${saved?.course?.code || 'The course'} was removed from your saved courses.`
    });
    return removed;
};

module.exports = {
    addSavedCourse,
    getMySavedCourses,
    removeSavedCourse
};
