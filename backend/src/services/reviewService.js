const prisma = require('../lib/prisma');

const VALID_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN']);

const reviewSelect = {
    id: true,
    userId: true,
    courseId: true,
    overallRating: true,
    difficultyRating: true,
    workloadRating: true,
    teachingRating: true,
    assessmentStyle: true,
    usefulnessRating: true,
    comment: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: { id: true, name: true, major: true }
    },
    course: {
        select: { id: true, code: true, name: true }
    }
};

const reportSelect = {
    id: true,
    reviewId: true,
    reporterId: true,
    reason: true,
    status: true,
    createdAt: true,
    review: {
        select: {
            id: true,
            comment: true,
            status: true,
            course: { select: { id: true, code: true, name: true } }
        }
    },
    reporter: {
        select: { id: true, name: true }
    }
};

const validateRating = (fieldName, value, required = true) => {
    if (value === undefined || value === null) {
        if (required) { throw new TypeError(`${fieldName} is required`); }
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

const ensureCourseExists = async (courseId) => {
    const course = await prisma.course.findFirst({
        where: { id: courseId, isActive: true }
    });
    if (!course) {
        const error = new Error('Course not found');
        error.statusCode = 404;
        throw error;
    }
    return course;
};

const createReview = async (data) => {
    validatePositiveInteger('userId', data.userId);
    validatePositiveInteger('courseId', data.courseId);
    validateReviewData(data, true);
    await ensureCourseExists(data.courseId);

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

    const existing = await prisma.review.findUnique({
        where: { userId_courseId: { userId, courseId } }
    });
    if (!existing) {
        const error = new Error('Review not found');
        error.statusCode = 404;
        throw error;
    }

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

const getApprovedReviewsByCourse = async (courseId) => {
    return prisma.review.findMany({
        where: {
            courseId: Number(courseId),
            status: 'APPROVED'
        },
        select: reviewSelect,
        orderBy: { createdAt: 'desc' }
    });
};

const getPendingReviews = async () => {
    return prisma.review.findMany({
        where: { status: 'PENDING' },
        select: reviewSelect,
        orderBy: { createdAt: 'asc' }
    });
};

const updateReviewStatus = async (reviewId, newStatus) => {
    if (!VALID_STATUSES.has(newStatus)) {
        throw new TypeError('Invalid review status');
    }

    const review = await prisma.review.findUnique({
        where: { id: Number(reviewId) }
    });
    if (!review) {
        const error = new Error('Review not found');
        error.statusCode = 404;
        throw error;
    }

    return prisma.review.update({
        where: { id: Number(reviewId) },
        data: { status: newStatus },
        select: reviewSelect
    });
};

const reportReview = async (reviewId, reporterId, reason) => {
    validatePositiveInteger('reviewId', reviewId);
    validatePositiveInteger('reporterId', reporterId);

    if (typeof reason !== 'string' || reason.trim() === '') {
        throw new TypeError('A report reason is required');
    }

    const review = await prisma.review.findUnique({
        where: { id: reviewId }
    });
    if (!review) {
        const error = new Error('Review not found');
        error.statusCode = 404;
        throw error;
    }

    return prisma.reviewReport.create({
        data: {
            reviewId,
            reporterId,
            reason: reason.trim()
        },
        select: reportSelect
    });
};

const getPendingReports = async () => {
    return prisma.reviewReport.findMany({
        where: { status: 'PENDING' },
        select: reportSelect,
        orderBy: { createdAt: 'asc' }
    });
};

const getCourseRatingSummary = async (courseId) => {
    const numericCourseId = Number(courseId);
    const groups = await prisma.review.groupBy({
        by: ['courseId'],
        where: {
            courseId: numericCourseId,
            status: 'APPROVED'
        },
        _avg: {
            overallRating: true,
            difficultyRating: true,
            workloadRating: true,
            teachingRating: true,
            usefulnessRating: true
        },
        _count: { _all: true }
    });

    if (groups.length === 0) {
        return {
            courseId: numericCourseId,
            reviewCount: 0,
            overallRating: null,
            difficultyRating: null,
            workloadRating: null,
            teachingRating: null,
            usefulnessRating: null
        };
    }

    const group = groups[0];
    return {
        courseId: numericCourseId,
        reviewCount: group._count._all,
        overallRating: group._avg.overallRating,
        difficultyRating: group._avg.difficultyRating,
        workloadRating: group._avg.workloadRating,
        teachingRating: group._avg.teachingRating,
        usefulnessRating: group._avg.usefulnessRating
    };
};

module.exports = {
    createReview,
    updateReview,
    getApprovedReviewsByCourse,
    getPendingReviews,
    updateReviewStatus,
    reportReview,
    getPendingReports,
    getCourseRatingSummary
};
