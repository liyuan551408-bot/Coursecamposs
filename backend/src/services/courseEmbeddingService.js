/** @file Implements course embedding business rules and persistence operations. */
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

/** Generate a course vector and persist it in PostgreSQL/pgvector. */
const refreshCourseEmbedding = async (course) => {
    const embedding = await aiService.generateEmbedding(buildCourseEmbeddingText(course));
    const vectorString = `[${embedding.join(',')}]`;

    await prisma.$executeRawUnsafe(
        `UPDATE "Course" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        course.id
    );
};

module.exports = {
    buildCourseEmbeddingText,
    refreshCourseEmbedding
};
