const prisma = require('../lib/prisma');
const userService = require('./userService');

const getStats = async () => {
    const [
        users,
        courses,
        activeCourses,
        reviews,
        pendingReviews,
        plans,
        reports,
        pendingReports
    ] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.course.count({ where: { isActive: true } }),
        prisma.review.count(),
        prisma.review.count({ where: { status: 'PENDING' } }),
        prisma.semesterPlan.count(),
        prisma.reviewReport.count(),
        prisma.reviewReport.count({ where: { status: 'PENDING' } })
    ]);

    return {
        users,
        courses,
        activeCourses,
        reviews,
        pendingReviews,
        plans,
        reports,
        pendingReports
    };
};

const userListSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true
};

const listUsers = async ({ page, limit, role }) => {
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};

    const [items, total, students, moderators, admins] = await Promise.all([
        prisma.user.findMany({
            where,
            select: userListSelect,
            orderBy: { id: 'asc' },
            skip,
            take: limit
        }),
        prisma.user.count({ where }),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'MODERATOR' } }),
        prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    return {
        items,
        total,
        page,
        limit,
        roleCounts: {
            STUDENT: students,
            MODERATOR: moderators,
            ADMIN: admins
        }
    };
};

const createStaffUser = async ({ email, password, name, role }) => {
    if (!['MODERATOR', 'ADMIN'].includes(role)) {
        const error = new TypeError('Only moderator and admin accounts can be created here');
        error.statusCode = 400;
        throw error;
    }

    return userService.createUser({ email, password, name, role });
};

const changeUserRole = async ({
    actorId,
    targetId,
    role
}) => {
    if (actorId === targetId) {
        const error = new Error(
            'You cannot change your own role here'
        );
        error.statusCode = 400;
        throw error;
    }

    const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true }
    });

    if (!target) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return prisma.user.update({
        where: { id: targetId },
        data: { role },
        select: userListSelect
    });
};

module.exports = {
    getStats,
    listUsers,
    createStaffUser,
    changeUserRole
};
