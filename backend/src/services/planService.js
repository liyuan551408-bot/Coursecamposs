/** @file Implements plan business rules and persistence operations. */
const prisma = require('../lib/prisma');
const { createNotificationsSafely, deleteExpired } = require('./notificationService');

// Create a semester plan owned by one user.
const createPlan = async (userId, data) => {
    const plan = await prisma.semesterPlan.create({
        data: {
            userId: Number(userId),
            name: data.name.trim(),
            year: Number(data.year),
            semester: data.semester
        }
    });
    await createNotificationsSafely([userId], { type: 'PLAN_CREATED', title: 'Semester plan created', message: `Your ${plan.semester} ${plan.year} plan is ready.` });
    return plan;
};

// Load all plans for a user together with their course details.
const getUserPlans = async (userId) => {
    return prisma.semesterPlan.findMany({
        where: { userId: Number(userId) },
        include: {
            // Traverse the join records to include each referenced course.
            planCourses: {
                include: {
                    course: true 
                }
            }
        },
        orderBy: [
            { year: 'desc' },
            { semester: 'desc' }
        ]
    });
};

const requireOwnedPlan = async (userId, planId) => {
    const plan = await prisma.semesterPlan.findUnique({ where: { id: Number(planId) } });
    if (!plan) {
        const error = new Error('Plan not found');
        error.statusCode = 404;
        throw error;
    }
    if (plan.userId !== Number(userId)) {
        const error = new Error('You do not have access to this plan');
        error.statusCode = 403;
        throw error;
    }
    return plan;
};

// Add a course to a plan and report unmet prerequisites.
const addCourseToPlan = async (userId, planId, courseId) => {
    const targetPlan = await requireOwnedPlan(userId, planId);
    // Load prerequisite ids before changing the plan.
    const course = await prisma.course.findFirst({
        where: { id: Number(courseId), isActive: true },
        include: { prerequisites: true }
    });

    if (!course) {
        const error = new Error('Active course not found');
        error.statusCode = 404;
        throw error;
    }

    let warnings = [];

    // Only perform completion checks when prerequisites exist.
    if (course.prerequisites.length > 0) {
        // Collect courses the user has already completed.
        const completed = await prisma.completedCourse.findMany({
            where: { userId: Number(userId) }
        });
        const completedIds = completed.map(c => c.courseId);

        // A planned prerequisite only counts when it occurs before the target
        // semester. Courses in the same or a later semester still need a warning.
        const planned = await prisma.planCourse.findMany({
            where: { plan: { userId: Number(userId) } },
            include: { plan: { select: { year: true, semester: true } } }
        });
        const semesterOrder = { SUMMER: 0, SEMESTER_1: 1, SEMESTER_2: 2 };
        const isEarlierPlan = (plan) => plan.year < targetPlan.year || (
            plan.year === targetPlan.year
            && (semesterOrder[plan.semester] ?? 99) < (semesterOrder[targetPlan.semester] ?? 99)
        );
        const plannedIds = planned.filter(({ plan }) => isEarlierPlan(plan)).map(({ courseId: id }) => id);

        // Warn only for prerequisites that are neither completed nor planned.
        const missingPrereqs = course.prerequisites.filter(p => 
            !completedIds.includes(p.id) && !plannedIds.includes(p.id)
        );

        if (missingPrereqs.length > 0) {
            const missingCodes = missingPrereqs.map(p => p.code).join(', ');
            warnings.push(`Warning: You may be missing prerequisites for this course: ${missingCodes}`);
        }
    }

    // Persist the requested course even when non-blocking warnings exist.
    const addedCourse = await prisma.planCourse.create({
        data: {
            planId: Number(planId),
            courseId: Number(courseId)
        },
        include: {
            course: true // Include details required to update the frontend immediately.
        }
    });

    // Return warnings alongside data so the controller can preserve both.
    const result = {
        ...addedCourse,
        warnings 
    };
    await createNotificationsSafely([userId], { type: 'PLAN_COURSE_ADDED', title: 'Course added to planner', message: `${course.code} was added to your ${planId} semester plan.` });
    return result;
};

// Remove one course from a plan owned by the user.
const removeCourseFromPlan = async (userId, planId, courseId) => {
    await requireOwnedPlan(userId, planId);
    const removed = await prisma.planCourse.delete({
        where: {
            planId_courseId: {
                planId: Number(planId),
                courseId: Number(courseId)
            }
        }
    });
    await createNotificationsSafely([userId], { type: 'PLAN_COURSE_REMOVED', title: 'Course removed from planner', message: `A course was removed from your semester plan.` });
    return removed;
};

const deletePlan = async (userId, planId) => {
    await requireOwnedPlan(userId, planId);
    return prisma.semesterPlan.delete({ where: { id: Number(planId) } });
};

module.exports = {
    createPlan,
    getUserPlans,
    addCourseToPlan,
    removeCourseFromPlan,
    deletePlan
};

// Keep long-lived notification tables bounded without affecting request latency.
setInterval(() => deleteExpired().catch((error) => console.error('Notification cleanup failed:', error)), 24 * 60 * 60 * 1000).unref();
