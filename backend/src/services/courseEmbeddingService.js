const prisma = require('../lib/prisma');
const aiService = require('./aiService');

const formatList = (value) => {
    if (!Array.isArray(value) || value.length === 0) {
        return 'Not specified';
    }
    return value.join(', ');
};

const buildCourseEmbeddingText = (course) => {
    const description = course.description || 'No detailed description available.';

    return [
        `Course code: ${course.code}`,
        `Course name: ${course.name}`,
        `Course description: ${description}`,
        `Course level: ${course.level ?? 'Not specified'}`,
        `Offered semesters: ${formatList(course.offeredSemesters)}`,
        `Assessment types: ${formatList(course.assessmentTypes)}`,
        `Workload hours: ${course.workloadHours ?? 'Not specified'}`,
        `Official link: ${course.officialLink || 'Not specified'}`
    ].join('. ');
};

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
