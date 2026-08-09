const prisma = require('../lib/prisma');

// 1. 创建新评价
const createReview = async (userId, courseId, data) => {
    return prisma.review.create({
        data: {
            userId: Number(userId),
            courseId: Number(courseId),
            overallRating: data.overallRating,
            difficultyRating: data.difficultyRating,
            workloadRating: data.workloadRating,
            comment: data.comment
        }
    });
};

// 2. 获取某门课程所有【已通过审核】的评价
const getApprovedReviewsByCourse = async (courseId) => {
    return prisma.review.findMany({
        where: {
            courseId: Number(courseId),
            status: 'APPROVED' // 前端默认只展示通过审核的
        },
        include: {
            // 顺便查出评价人的名字和专业，但绝不能返回密码！
            user: {
                select: { name: true, major: true }
            }
        },
        orderBy: { createdAt: 'desc' } // 按时间倒序
    });
};

// 3. 管理员审核评价（更新状态）
const updateReviewStatus = async (reviewId, newStatus) => {
    return prisma.review.update({
        where: { id: Number(reviewId) },
        data: { status: newStatus }
    });
};

module.exports = {
    createReview,
    getApprovedReviewsByCourse,
    updateReviewStatus
};