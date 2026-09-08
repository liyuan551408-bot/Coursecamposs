const prisma = require('../lib/prisma');
const aiService = require('./aiService');

/** Convert a course attribute list into text suitable for semantic embedding. */
const formatList = (value) => {
    if (!Array.isArray(value) || value.length === 0) {
        return 'Not specified';
    }
    return value.join(', ');
};

/** Build the single canonical text representation used for every course vector. */
const buildCourseEmbeddingText = (course) => {
    const description = course.description || 'No detailed description available.';

    return [
        `Course code: ${course.code}`,
        `Course name: ${course.name}`,
        `Course description: ${description}`,
        `Course level: ${course.level ?? 'Not specified'}`,
        `Course credits: ${course.credits ?? 'Not specified'}`,
        `Offered semesters: ${formatList(course.offeredSemesters)}`,
        `Assessment types: ${formatList(course.assessmentTypes)}`,
        `Workload hours: ${course.workloadHours ?? 'Not specified'}`
    ].join('. ');
};

/** Generate a course vector and persist it in PostgreSQL */
const refreshCourseEmbedding = async (course) => {
    const embedding = await aiService.generateEmbedding(buildCourseEmbeddingText(course));
    const vectorString = `[${embedding.join(',')}]`;

    await prisma.$executeRawUnsafe(
        `UPDATE "Course" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        course.id
    );
};

/** Execute one course embedding job without allowing provider failures to escape. */
const runCourseEmbeddingJob = async (course, refresh = refreshCourseEmbedding) => {
    try {
        await refresh(course);
        console.log(`[Embedding job] Stored vector for ${course.code}`);
        return true;
    } catch (error) {
        console.error(`[Embedding job] Failed for ${course.code}:`, error.message);
        return false;
    }
};

/** Schedule one non-blocking embedding job after a course has been persisted. */
const enqueueCourseEmbedding = (
    course,
    { schedule = setImmediate, runJob = runCourseEmbeddingJob } = {}
) => {
    schedule(() => Promise.resolve(runJob(course)).catch((error) => {
        console.error(`[Embedding job] Unexpected failure for ${course.code}:`, error.message);
    }));
};

module.exports = {
    buildCourseEmbeddingText,
    refreshCourseEmbedding,
    runCourseEmbeddingJob,
    enqueueCourseEmbedding
};
