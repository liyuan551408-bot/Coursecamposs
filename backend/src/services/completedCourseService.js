/** @file Implements completed course business rules and persistence operations. */
const prisma = require('../lib/prisma');

const completedCourseSelect = {
    userId: true,
    courseId: true,
    completedAt: true,
    course: {
        select: {
            id: true,
            code: true,
            name: true,
            credits: true
        }
    }
};

const validatePositiveInteger = (fieldName, value) => {
    if (!Number.isInteger(value) || value <= 0) {
        throw new TypeError(
            `${fieldName} must be a positive integer`
        );
    }
};

const normalizeCompletedAt = (value) => {
    if (value === undefined || value === null) {
        return new Date();
    }

    const completedAt =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(completedAt.getTime())) {
        throw new TypeError('Invalid completion date');
    }

    return completedAt;
};

const markCourseCompleted = async (
    userId,
    courseId,
    completedAt
) => {
    validatePositiveInteger('userId', userId);
    validatePositiveInteger('courseId', courseId);

    const normalizedDate =
        normalizeCompletedAt(completedAt);

    // Upsert makes repeated completion requests idempotent while allowing date corrections.
    return prisma.completedCourse.upsert({
        where: {
            userId_courseId: {
                userId,
                courseId
            }
        },
        update: {
            completedAt: normalizedDate
        },
        create: {
            userId,
            courseId,
            completedAt: normalizedDate
        },
        select: completedCourseSelect
    });
};

const unmarkCourseCompleted = async (
    userId,
    courseId
) => {
    validatePositiveInteger('userId', userId);
    validatePositiveInteger('courseId', courseId);

    // deleteMany turns an already-absent record into a harmless false result instead of an exception.
    const result =
        await prisma.completedCourse.deleteMany({
            where: {
                userId,
                courseId
            }
        });

    return result.count > 0;
};

const getCompletedCoursesByUser = async (userId) => {
    validatePositiveInteger('userId', userId);

    return prisma.completedCourse.findMany({
        where: {
            userId
        },
        select: completedCourseSelect,
        orderBy: {
            course: {
                code: 'asc'
            }
        }
    });
};

module.exports = {
    markCourseCompleted,
    unmarkCourseCompleted,
    getCompletedCoursesByUser
};
