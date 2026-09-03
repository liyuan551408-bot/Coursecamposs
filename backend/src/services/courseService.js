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


// 1. 创建课程（支持绑定先决条件）
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

    // 如果传入了先决课程的 ID 数组，使用 connect 关联
    if (prerequisiteIds && prerequisiteIds.length > 0) {
        data.prerequisites = {
            connect: prerequisiteIds.map(id => ({ id: Number(id) }))
        };
    }

    const createdCourse = await prisma.course.create({
        data,
        // 这里为了能返回关联数据，我们直接包含前置课程字段
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

// 2. 根据 ID 获取单门课程详情（带出它需要的前置课程）
const getCourseById = async (id) => {
    return prisma.course.findUnique({
        where: { id: Number(id) },
        include: {
            prerequisites: true,     // 查出学这门课前必须要修的课
            prerequisiteFor: true    // 查出这门课是哪些高级课的先决条件
        }
    });
};

// 3. 根据多个 ID 批量获取课程（用于横向对比）
const getCoursesByIds = async (courseIds) => {
    return prisma.course.findMany({
        where: {
            // 使用 in 操作符，匹配数组中的任何一个 ID
            id: { 
                in: courseIds.map(id => Number(id)) 
            },
            isActive: true // 只对比还在开设的课程
        },
        include: {
            prerequisites: true // 把先决条件也带上，方便学生对比
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

// 多条件高级搜索课程
const searchCourses = async (queryFilters) => {
    const { keyword, level, semester, assessmentType, minCredits, maxCredits } = queryFilters;
    const whereClause = { isActive: true }; // 默认只搜还在开设的课

    // 1. 课程代码、名称或描述中查找
    if (keyword) {
        whereClause.OR = [
            { code: { contains: keyword, mode: 'insensitive' } },
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } }
        ];
    }

    // 2. 课程级别 
    if (level) {
        whereClause.level = Number(level);
    }

    // 3. 学期 
    if (semester) {
        whereClause.offeredSemesters = { has: semester };
    }

    // 4. 考核方式 
    if (assessmentType) {
        whereClause.assessmentTypes = { has: assessmentType };
    }

    // 5. 学分范围过滤
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
