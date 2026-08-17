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
    updatedAt: true,
    offeredSemesters: true,
    level: true,
    assessmentTypes: true,
    officialLink: true,
    prerequisites: {
        select: {
            id:true,
            code:true,
            name:true
        },
        orderBy: {
            code: 'asc'
        }
    },

};
const courseDetailSelect = {
    ...courseSelect,

    reviews: {
        where: {
            status: 'APPROVED'
        },
        select: {
            id:true,
            overallRating:true,
            difficultyRating:true,
            workloadRating:true,
            teachingRating:true,
            assessmentStyle:true,
            usefulnessRating:true,
            comment:true,
            createdAt:true,

            user: {
                select: {
                    id:true,
                    name:true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    }
};

const getAllCourses = async ({ skip = 0, take = 50 } = {}) => {
    const safeSkip =
        Number.isInteger(skip) && skip >= 0
            ? skip
            : 0;

    const safeTake =
        Number.isInteger(take) && take > 0
            ? Math.min(take, 100)
            : 50;

    return prisma.course.findMany({
        where: {
            isActive: true
        },
        select: courseSelect,
        orderBy: {
            code: 'asc'
        },
        skip: safeSkip,
        take: safeTake
    });
};

const getCourseByCode = async (code) => {
    if (typeof code !== 'string' || code.trim() === '') {
        throw new TypeError('A valid course code is required');
    }

    const normalizedCode = code.trim().toUpperCase();

    return prisma.course.findUnique({
        where: {
            code: normalizedCode
        },
        select: courseDetailSelect
    });
};

module.exports = {
    getAllCourses,
    getCourseByCode
};
