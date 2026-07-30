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

module.exports = {
    getAllCourses
};