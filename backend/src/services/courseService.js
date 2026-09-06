/** @file Implements course business rules and persistence operations. */
const { getCourses } = require('../controllers/courseController');
const prisma = require('../lib/prisma');
const { refreshCourseEmbedding } = require('./courseEmbeddingService');

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
    const safeSkip = Number.isInteger(skip) && skip >= 0 ? skip : 0;
    const safeTake = Number.isInteger(take) && take > 0 ? Math.min(take, 100) : 50;

    return prisma.course.findMany({
        where: { isActive: true },
        select: courseSelect,
        orderBy: { code: 'asc'},
        skip: safeSkip,
        take: safeTake
    });
};


// Create a course and optionally connect its prerequisites.
const createCourse = async (courseData, prerequisiteIds = []) => {
    const data = {
        name: courseData.name,
        code: courseData.code,
        credits: courseData.credits,
        description: courseData.description,
        workloadHours: courseData.workloadHours,
        offeredSemesters: courseData.offeredSemesters,
        level: courseData.level,
        assessmentTypes: courseData.assessmentTypes,
        officialLink: courseData.officialLink
    };

    // Connect existing prerequisite rows only when ids were supplied.
    if (prerequisiteIds && prerequisiteIds.length > 0) {
        data.prerequisites = {
            connect: prerequisiteIds.map(id => ({ id: Number(id) }))
        };
    }

    const createdCourse = await prisma.course.create({
        data,
        // Return prerequisite details so callers do not need a follow-up query.
        include: {
            prerequisites: true 
        }
    });

    try {
        await refreshCourseEmbedding(createdCourse);
    } catch (error) {
        console.error(`Course embedding generation failed for ${createdCourse.code}:`, error);
    }

    return createdCourse;
};

const updateCourse = async (id, courseData) => {
    const allowedFields = [
        'name', 'code', 'credits', 'description', 'workloadHours',
        'offeredSemesters', 'level', 'assessmentTypes', 'officialLink', 'isActive'
    ];
    const data = Object.fromEntries(
        allowedFields
            .filter((field) => courseData[field] !== undefined)
            .map((field) => [field, courseData[field]])
    );

    const updatedCourse = await prisma.course.update({
        where: { id: Number(id) },
        data
    });

    try {
        await refreshCourseEmbedding(updatedCourse);
    } catch (error) {
        console.error(`Course embedding generation failed for ${updatedCourse.code}:`, error);
    }

    return updatedCourse;
};

// Fetch one course together with both directions of its prerequisite graph.
const getCourseById = async (id) => {
    return prisma.course.findUnique({
        where: { id: Number(id) },
        include: {
            prerequisites: true,     // Courses that should be completed first.
            prerequisiteFor: true    // Follow-on courses unlocked by this course.
        }
    });
};

// Fetch several active courses for side-by-side comparison.
const getCoursesByIds = async (courseIds) => {
    return prisma.course.findMany({
        where: {
            // Match any requested id in a single database query.
            id: { 
                in: courseIds.map(id => Number(id)) 
            },
            isActive: true // Exclude courses that are no longer offered.
        },
        include: {
            prerequisites: true // Include prerequisite context in comparisons.
        }
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
        throw new TypeError('Course codes must be an array');
    }

    const normalizedCodes = [
        ...new Set(
            codes.map((code) => {
                if (typeof code !== 'string' || code.trim() === '') {
                    throw new TypeError('Each course code must be a non-empty string');
                }
                return code.trim().toUpperCase();
            })
        )
    ];

    if (normalizedCodes.length < 2 || normalizedCodes.length > 4) {
        throw new TypeError('Select between 2 and 4 different courses');
    }

    return normalizedCodes;
};

const getCoursesForComparison = async (codes) => {
    const normalizedCodes = normalizeCourseCodes(codes);

    const courses = await prisma.course.findMany({
        where: {
            code: { in: normalizedCodes },
            isActive: true
        },
        select: courseSelect,
        orderBy: { code: 'asc' }
    });

    const foundCodes = new Set(courses.map((course) => course.code));
    const missingCodes = normalizedCodes.filter((code) => !foundCodes.has(code));

    if (missingCodes.length > 0) {
        throw new Error(`Courses not found: ${missingCodes.join(', ')}`);
    }

    const courseIds = courses.map((course) => course.id);

    const ratingGroups = await prisma.review.groupBy({
        by: ['courseId'],
        where: {
            courseId: { in: courseIds },
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

    const ratingsByCourseId = new Map(
        ratingGroups.map((group) => [
            group.courseId,
            {
                reviewCount: group._count._all,
                overallRating: group._avg.overallRating,
                difficultyRating: group._avg.difficultyRating,
                workloadRating: group._avg.workloadRating,
                teachingRating: group._avg.teachingRating,
                usefulnessRating: group._avg.usefulnessRating
            }
        ])
    );

    return courses.map((course) => ({
        ...course,
        ratingSummary: ratingsByCourseId.get(course.id) ?? {
            reviewCount: 0,
            overallRating: null,
            difficultyRating: null,
            workloadRating: null,
            teachingRating: null,
            usefulnessRating: null
        }
    }));
};

// Search active courses using optional text and structured filters.
const searchCourses = async (queryFilters) => {
    const { keyword, level, semester, assessmentType, minCredits, maxCredits } = queryFilters;
    const whereClause = { isActive: true }; // Inactive courses are excluded by default.

    // Apply case-insensitive text matching across code, name, and description.
    if (keyword) {
        whereClause.OR = [
            { code: { contains: keyword, mode: 'insensitive' } },
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } }
        ];
    }

    // Narrow results to the requested course level.
    if (level) {
        whereClause.level = Number(level);
    }

    // Narrow results to a teaching semester.
    if (semester) {
        whereClause.offeredSemesters = { has: semester };
    }

    // Narrow results to an assessment type.
    if (assessmentType) {
        whereClause.assessmentTypes = { has: assessmentType };
    }

    // Apply inclusive lower and upper credit bounds.
    if (minCredits || maxCredits) {
        whereClause.credits = {};
        if (minCredits) whereClause.credits.gte = Number(minCredits); 
        if (maxCredits) whereClause.credits.lte = Number(maxCredits); 
    }

    return prisma.course.findMany({
        where: whereClause,
        select: courseSelect, 
        orderBy: { code: 'asc' }
    });
};

module.exports = {
    getAllCourses,
    createCourse,
    updateCourse,
    getCourseById,
    getCoursesByIds,
    getCourseByCode,
    getCoursesForComparison,
    searchCourses
};
