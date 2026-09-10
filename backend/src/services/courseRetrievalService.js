/** @file Implements course retrieval business rules and persistence operations. */
const prisma = require('../lib/prisma');
const aiService = require('./aiService');

const DEFAULT_THRESHOLD = Number(process.env.AI_SIMILARITY_THRESHOLD) || 0.35;

// Raw PostgreSQL enum arrays can be returned as either JavaScript arrays or
// array-literal strings, depending on the database adapter. Keep the API shape
// stable so frontend consumers never iterate over a string character by character.
const normalizeEnumArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];

    const arrayLiteral = value.trim();
    if (!arrayLiteral || arrayLiteral === '{}') return [];

    const content = arrayLiteral.startsWith('{') && arrayLiteral.endsWith('}')
        ? arrayLiteral.slice(1, -1)
        : arrayLiteral;

    return content
        .split(',')
        .map(item => item.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
};

/** Embed a query, apply structured filters, and retrieve the closest active courses. */
const semanticSearchCourses = async ({
    query,
    limit = 5,
    threshold = DEFAULT_THRESHOLD,
    semester,
    assessmentType,
    minCredits,
    maxCredits,
    level
}) => {
    const embedding = await aiService.generateEmbedding(query);
    const vectorString = `[${embedding.join(',')}]`;
    const filters = [];
    const values = [vectorString, threshold];
    if (semester) {
        values.push(semester);
        filters.push(`AND "offeredSemesters" @> ARRAY[$${values.length}]::"CourseSemester"[]`);
    }
    if (assessmentType) {
        values.push(assessmentType);
        filters.push(`AND "assessmentTypes" @> ARRAY[$${values.length}]::"AssessmentType"[]`);
    }
    if (minCredits !== undefined) {
        values.push(minCredits);
        filters.push(`AND credits >= $${values.length}::int`);
    }
    if (maxCredits !== undefined) {
        values.push(maxCredits);
        filters.push(`AND credits <= $${values.length}::int`);
    }
    if (level !== undefined) {
        values.push(level);
        filters.push(`AND level = $${values.length}::int`);
    }
    values.push(limit);
    const courses = await prisma.$queryRawUnsafe(`
        SELECT id, code, name, description, credits, level,
               "offeredSemesters", "assessmentTypes", "workloadHours", "officialLink",
               CAST(1 - (embedding <=> $1::vector) AS TEXT) AS similarity_text
        FROM "Course"
        WHERE embedding IS NOT NULL
          AND "isActive" = true
          AND 1 - (embedding <=> $1::vector) >= $2::float
          ${filters.join('\n          ')}
        ORDER BY embedding <=> $1::vector
        LIMIT $${values.length}::int;
    `, ...values);

    return courses.map(course => ({
        id: course.id,
        code: course.code,
        name: course.name,
        description: course.description,
        credits: course.credits,
        level: course.level,
        offeredSemesters: normalizeEnumArray(course.offeredSemesters),
        assessmentTypes: normalizeEnumArray(course.assessmentTypes),
        workloadHours: course.workloadHours,
        officialLink: course.officialLink,
        similarity: Number(course.similarity_text) || 0
    }));
};

module.exports = { semanticSearchCourses };
