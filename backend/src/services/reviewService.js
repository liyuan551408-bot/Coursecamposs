const prisma = require('../lib/prisma');

const reviewSelect = {
    id:true,
    userId:true,
    courseId:true,
    overallRating:true,
    difficultyRating:true,
    workloadRating:true,
    teachingRating:true,
    assessmentStyle:true,
    usefulnessRating:true,
    comment:true,
    status:true,
    createdAt:true,
    updatedAt:true,
    user: {
        select: { id:true, name:true, major:true } // 融合了你之前的要求，带上 major
    },
    course: {
        select: { id:true, code:true, name:true }
    }
};

const validateRating = (fieldName, value, required = true) => {
    if(value === undefined || value === null){
        if(required){ throw new TypeError(`${fieldName} is required`); }
        return;
    }
    if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new TypeError(`${fieldName} must be an integer between 1 and 5`);
    }
};

const assessmentStyles = new Set([
    'EXAM_HEAVY', 'COURSEWORK_HEAVY', 'PROJECT_BASED', 'PRACTICAL', 'BALANCED'
]);

const validateAssessmentStyle = (value) => {
    if (value === undefined || value === null) return;
    if (!assessmentStyles.has(value)) {
        throw new TypeError('Invalid assessment style');
    }
};

const validatePositiveInteger = (fieldName, value) => {
    if (!Number.isInteger(value) || value <= 0) {
        throw new TypeError(`${fieldName} must be a positive integer`);
    }
};

const validateReviewData = (data, required) => {
    validateRating('overallRating', data.overallRating, required);
    validateRating('difficultyRating', data.difficultyRating, required);
    validateRating('workloadRating', data.workloadRating, required);
    validateRating('teachingRating', data.teachingRating, false);
    validateRating('usefulnessRating', data.usefulnessRating, false);
    validateAssessmentStyle(data.assessmentStyle);

    if (data.comment !== undefined && data.comment !== null && typeof data.comment !== 'string') {
        throw new TypeError('Comment must be a string');
    }
};

const createReview = async (data) => {
    validatePositiveInteger('userId', data.userId);
    validatePositiveInteger('courseId', data.courseId);
    validateReviewData(data, true);

    return prisma.review.create({
        data: {
            userId: data.userId,
            courseId: data.courseId,
            overallRating: data.overallRating,
            difficultyRating: data.difficultyRating,
            workloadRating: data.workloadRating,
            teachingRating: data.teachingRating ?? null,
            assessmentStyle: data.assessmentStyle ?? null,
            usefulnessRating: data.usefulnessRating ?? null,
            comment: data.comment ?? null,
            status: 'PENDING'
        },
        select: reviewSelect
    });
};

const updateReview = async (userId, courseId, data) => {
    validatePositiveInteger('userId', userId);
    validatePositiveInteger('courseId', courseId);
    validateReviewData(data, false);

    const updateData = {};
    const editableFields = [
        'overallRating', 'difficultyRating', 'workloadRating', 'teachingRating',
        'assessmentStyle', 'usefulnessRating', 'comment'
    ];

    for (const field of editableFields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    }
    updateData.status = 'PENDING';

    return prisma.review.update({
        where: { userId_courseId: { userId, courseId } },
        data: updateData,
        select: reviewSelect
    });
};

// --- 下面是你原有的功能，完美保留 ---

// 获取某门课程所有【已通过审核】的评价
const getApprovedReviewsByCourse = async (courseId) => {
    return prisma.review.findMany({
        where: {
            courseId: Number(courseId),
            status: 'APPROVED'
        },
        select: reviewSelect, // 使用上面统一安全的格式
        orderBy: { createdAt: 'desc' }
    });
};

// 管理员审核评价（更新状态）
const updateReviewStatus = async (reviewId, newStatus) => {
    return prisma.review.update({
        where: { id: Number(reviewId) },
        data: { status: newStatus },
        select: reviewSelect
    });
};

module.exports = {
    createReview,
    updateReview,
    getApprovedReviewsByCourse,
    updateReviewStatus
};