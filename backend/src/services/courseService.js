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

const normalizeCourseCodes = (codes) => {
    if (!Array.isArray(codes)) {
        throw new TypeError(
            'Course codes must be an array'
        );
    }

    const normalizedCodes = [
        ...new Set(
            codes.map((code) => {
                if (
                    typeof code !== 'string' ||
                    code.trim() === ''
                ) {
                    throw new TypeError(
                        'Each course code must be a non-empty string'
                    );
                }

                return code.trim().toUpperCase();
            })
        )
    ];

    if (
        normalizedCodes.length < 2 ||
        normalizedCodes.length > 4
    ) {
        throw new TypeError(
            'Select between 2 and 4 different courses'
        );
    }

    return normalizedCodes;
};

const getCoursesForComparison = async (codes) => {
    const normalizedCodes =
        normalizeCourseCodes(codes);

    const courses = await prisma.course.findMany({
        where: {
            code: {
                in: normalizedCodes
            },
            isActive: true
        },
        select: courseSelect,
        orderBy: {
            code: 'asc'
        }
    });

    const foundCodes = new Set(
        courses.map((course) => course.code)
    );

    const missingCodes = normalizedCodes.filter(
        (code) => !foundCodes.has(code)
    );

    if (missingCodes.length > 0) {
        throw new Error(
            `Courses not found: ${missingCodes.join(', ')}`
        );
    }

    const courseIds = courses.map(
        (course) => course.id
    );

    const ratingGroups = await prisma.review.groupBy({
        by: ['courseId'],
        where: {
            courseId: {
                in: courseIds
            },
            status: 'APPROVED'
        },
        _avg: {
            overallRating: true,
            difficultyRating: true,
            workloadRating: true,
            teachingRating: true,
            usefulnessRating: true
        },
        _count: {
            _all: true
        }
    });

    const ratingsByCourseId = new Map(
        ratingGroups.map((group) => [
            group.courseId,
            {
                reviewCount: group._count._all,
                overallRating:
                    group._avg.overallRating,
                difficultyRating:
                    group._avg.difficultyRating,
                workloadRating:
                    group._avg.workloadRating,
                teachingRating:
                    group._avg.teachingRating,
                usefulnessRating:
                    group._avg.usefulnessRating
            }
        ])
    );

    return courses.map((course) => ({
        ...course,
        ratingSummary:
            ratingsByCourseId.get(course.id) ?? {
                reviewCount: 0,
                overallRating: null,
                difficultyRating: null,
                workloadRating: null,
                teachingRating: null,
                usefulnessRating: null
            }
    }));
};



module.exports = {
    getAllCourses,
    getCourseByCode,
    getCoursesForComparison
};
