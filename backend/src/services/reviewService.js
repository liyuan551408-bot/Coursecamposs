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
        select: {
            id:true,
            name:true
        }
    },

    course: {
        select: {
            id:true,
            code:true,
            name:true
        }
    }
};

const validateRating = (fieldName, value, required = true) => {
    if(value === undefined || value === null){
        if(required){
            throw new TypeError(`${fieldName} is required`);
        }
        return;
    }

    if (
        !Number.isInteger(value) ||value < 1||value > 5) {
        throw new TypeError(
            `${fieldName} must be an integer between 1 and 5`
        );
    }

    // 1. 如果值是 undefined 或 null：
    //    required 为 true 时抛出 TypeError
    //    required 为 false 时直接 return

    // 2. 检查 value 是否为整数

    // 3. 检查 value 是否处于合法评分范围

    // 4. 不合法时抛出 TypeError
};

const assessmentStyles = new Set([
    'EXAM_HEAVY',
    'COURSEWORK_HEAVY',
    'PROJECT_BASED',
    'PRACTICAL',
    'BALANCED'
]);

const validateAssessmentStyle = (value) => {
    // 没提供该可选字段时，直接结束
    if (value === undefined || value === null) {
        return;
    }

    // .has(value) 表示清单中是否存在这个值
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
    validateRating(
        'overallRating',
        data.overallRating,
        required
    );

    validateRating(
        'difficultyRating',
        data.difficultyRating,
        required
    );

    validateRating(
        'workloadRating',
        data.workloadRating,
        required
    );

    validateRating(
        'teachingRating',
        data.teachingRating,
        false
    );

    validateRating(
        'usefulnessRating',
        data.usefulnessRating,
        false
    );

    validateAssessmentStyle(data.assessmentStyle);

    if (
        data.comment !== undefined &&
        data.comment !== null &&
        typeof data.comment !== 'string'
    ) {
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
        'overallRating',
        'difficultyRating',
        'workloadRating',
        'teachingRating',
        'assessmentStyle',
        'usefulnessRating',
        'comment'
    ];

    for (const field of editableFields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    }

    // 评价被修改后重新进入审核状态
    updateData.status = 'PENDING';

    return prisma.review.update({
        where: {
            userId_courseId: {
                userId,
                courseId
            }
        },
        data: updateData,
        select: reviewSelect
    });
};

module.exports = {
    createReview,
    updateReview
};
