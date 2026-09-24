const prisma = require('../lib/prisma');

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
        prisma.course.count({
            where: { isActive: true }
        }),
        prisma.review.count(),
        prisma.review.count({
            where: { status: 'PENDING' }
        }),
        prisma.semesterPlan.count(),
        prisma.reviewReport.count(),
        prisma.reviewReport.count({
            where: { status: 'PENDING' }
        })
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
    major: true,
    studyYear: true,
    createdAt: true
};

const listUsers = async ({ page, limit }) => {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.user.findMany({
            select: userListSelect,
            orderBy: { id: 'asc' },
            skip,
            take: limit
        }),
        prisma.user.count()
    ]);

    return {
        items,
        total,
        page,
        limit
    };
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
    changeUserRole
};
