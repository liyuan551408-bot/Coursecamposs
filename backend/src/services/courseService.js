/** @file Implements course business rules and persistence operations. */
const prisma = require('../lib/prisma');
const {
    refreshCourseEmbedding,
    enqueueCourseEmbedding
} = require('./courseEmbeddingService');
const { rankFuzzyCourses } = require('../utils/fuzzySearch');

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

const getAllCoursesForAdmin = async () => prisma.course.findMany({
    select: courseSelect,
    orderBy: { code: 'asc' }
});


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

    // Resolve either numeric course IDs or course codes before connecting.
    if (prerequisiteIds && prerequisiteIds.length > 0) {
        const references = [...new Set(prerequisiteIds.map((value) => String(value).trim()).filter(Boolean))];
        const numericIds = references.filter((value) => /^\d+$/.test(value)).map(Number);
        // Course codes such as 159.101 are often entered as 159101.
        const codeAlias = (value) => /^\d{6}$/.test(value)
            ? `${value.slice(0, 3)}.${value.slice(3)}`
            : value.toUpperCase();
        const courseCodes = references
            .filter((value) => !/^\d+$/.test(value) || /^\d{6}$/.test(value))
            .flatMap((value) => [value.toUpperCase(), codeAlias(value)])
            .filter((value, index, values) => values.indexOf(value) === index);
        const lookup = [];
        if (numericIds.length > 0) lookup.push({ id: { in: numericIds } });
        if (courseCodes.length > 0) lookup.push({ code: { in: courseCodes } });
        const prerequisiteCourses = await prisma.course.findMany({
            where: { OR: lookup },
            select: { id: true, code: true }
        });
        const foundReferences = new Set(prerequisiteCourses.flatMap((course) => [String(course.id), course.code.toUpperCase()]));
        const missing = references.filter((reference) => {
            const normalized = reference.toUpperCase();
            return !foundReferences.has(reference)
                && !foundReferences.has(normalized)
                && !foundReferences.has(codeAlias(reference));
        });
        if (missing.length > 0) {
            const error = new Error('One or more prerequisite courses do not exist');
            error.code = 'PREREQUISITE_NOT_FOUND';
            error.meta = { missing };
            throw error;
        }
        data.prerequisites = {
            connect: prerequisiteCourses.map((course) => ({ id: course.id }))
        };
    }

    const createdCourse = await prisma.course.create({
        data,
        // Return prerequisite details so callers do not need a follow-up query.
        include: {
            prerequisites: true 
        }
    });

    enqueueCourseEmbedding(createdCourse);

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

    if (courseData.prerequisiteIds !== undefined) {
        if (!Array.isArray(courseData.prerequisiteIds)) {
            throw new TypeError('prerequisiteIds must be an array');
        }
        const references = [...new Set(courseData.prerequisiteIds.map(String).map((value) => value.trim()).filter(Boolean))];
        const numericIds = references.filter((value) => /^\d+$/.test(value)).map(Number);
        const codes = references.filter((value) => !/^\d+$/.test(value)).map((value) => value.toUpperCase());
        const lookup = [];
        if (numericIds.length) lookup.push({ id: { in: numericIds } });
        if (codes.length) lookup.push({ code: { in: codes } });
        const prerequisiteCourses = lookup.length
            ? await prisma.course.findMany({ where: { OR: lookup }, select: { id: true, code: true } })
            : [];
        if (prerequisiteCourses.some((course) => course.id === Number(id))) {
            throw new TypeError('A course cannot be its own prerequisite');
        }
        if (prerequisiteCourses.length !== references.length) {
            const error = new Error('One or more prerequisite courses do not exist');
            error.code = 'PREREQUISITE_NOT_FOUND';
            throw error;
        }
        data.prerequisites = { set: prerequisiteCourses.map((course) => ({ id: course.id })) };
    }

    const updatedCourse = await prisma.course.update({
        where: { id: Number(id) },
        data,
        include: { prerequisites: true }
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

// Fetch the complete, evidence-based context needed for an AI comparison.
// Reviews are limited to recent approved entries so the prompt stays focused.
const getCoursesForComparisonAnalysis = async (courseIds) => {
    const normalizedIds = [...new Set(courseIds.map(id => Number(id)))];
    const courses = await prisma.course.findMany({
        where: {
            id: { in: normalizedIds },
            isActive: true
        },
        select: {
            id: true,
            code: true,
            name: true,
            description: true,
            credits: true,
            workloadHours: true,
            level: true,
            offeredSemesters: true,
            assessmentTypes: true,
            prerequisites: {
                select: { id: true, code: true, name: true },
                orderBy: { code: 'asc' }
            },
            prerequisiteFor: {
                select: { id: true, code: true, name: true },
                orderBy: { code: 'asc' }
            },
            reviews: {
                where: { status: 'APPROVED' },
                select: {
                    overallRating: true,
                    difficultyRating: true,
                    workloadRating: true,
                    teachingRating: true,
                    usefulnessRating: true,
                    assessmentStyle: true,
                    comment: true
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        }
    });

    return courses.map(course => {
        const reviews = course.reviews;
        const average = field => {
            const values = reviews
                .map(review => review[field])
                .filter(value => value !== null && value !== undefined);
            return values.length
                ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
                : null;
        };

        return {
            id: course.id,
            code: course.code,
            name: course.name,
            // Keep the provider prompt bounded even when database text is long.
            description: course.description ? course.description.slice(0, 2000) : null,
            credits: course.credits,
            workloadHours: course.workloadHours,
            level: course.level,
            offeredSemesters: course.offeredSemesters,
            assessmentTypes: course.assessmentTypes,
            prerequisites: course.prerequisites,
            prerequisiteFor: course.prerequisiteFor,
            reviewSummary: {
                reviewCount: reviews.length,
                overallRating: average('overallRating'),
                difficultyRating: average('difficultyRating'),
                workloadRating: average('workloadRating'),
                teachingRating: average('teachingRating'),
                usefulnessRating: average('usefulnessRating'),
                assessmentStyles: [...new Set(reviews.map(review => review.assessmentStyle).filter(Boolean))],
                comments: reviews
                    .map(review => review.comment)
                    .filter(Boolean)
                    .slice(0, 5)
                    .map(comment => comment.slice(0, 500))
            }
        };
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
    const { keyword, mode = 'keyword', level, semester, assessmentType, minCredits, maxCredits } = queryFilters;
    const whereClause = { isActive: true }; // Inactive courses are excluded by default.
    const numericFilters = {};
    for (const [field, value] of Object.entries({ level, minCredits, maxCredits })) {
        if (value !== undefined && value !== '') {
            const parsed = Number(value);
            if (!Number.isInteger(parsed) || parsed < 0) throw new TypeError(`${field} must be a non-negative whole number`);
            numericFilters[field] = parsed;
        }
    }
    if (numericFilters.minCredits !== undefined && numericFilters.maxCredits !== undefined
        && numericFilters.minCredits > numericFilters.maxCredits) {
        throw new TypeError('minCredits cannot exceed maxCredits');
    }
    if (semester && !['SEMESTER_1', 'SEMESTER_2', 'SUMMER'].includes(semester)) {
        throw new TypeError('Invalid semester filter');
    }
    if (assessmentType && !['EXAM', 'ASSIGNMENT', 'QUIZ', 'PROJECT', 'LAB', 'PRESENTATION'].includes(assessmentType)) {
        throw new TypeError('Invalid assessment type filter');
    }
    if (!['keyword', 'fuzzy'].includes(mode)) {
        throw new TypeError('Invalid search mode');
    }

    // Apply case-insensitive text matching across code, name, and description.
    if (keyword && mode === 'keyword') {
        whereClause.OR = [
            { code: { contains: keyword, mode: 'insensitive' } },
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } }
        ];
    }

    // Narrow results to the requested course level.
    if (numericFilters.level !== undefined) {
        whereClause.level = numericFilters.level;
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
    if (numericFilters.minCredits !== undefined || numericFilters.maxCredits !== undefined) {
        whereClause.credits = {};
        if (numericFilters.minCredits !== undefined) whereClause.credits.gte = numericFilters.minCredits;
        if (numericFilters.maxCredits !== undefined) whereClause.credits.lte = numericFilters.maxCredits;
    }

    const courses = await prisma.course.findMany({
        where: whereClause,
        select: courseSelect, 
        orderBy: { code: 'asc' }
    });

    return keyword && mode === 'fuzzy' ? rankFuzzyCourses(courses, keyword) : courses;
};

module.exports = {
    getAllCourses,
    getAllCoursesForAdmin,
    createCourse,
    updateCourse,
    getCourseById,
    getCoursesByIds,
    getCoursesForComparisonAnalysis,
    getCourseByCode,
    getCoursesForComparison,
    searchCourses
};
