require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const aiService = require('../src/services/aiService');
const { buildCourseEmbeddingText } = require('../src/services/courseEmbeddingService');

const prisma = new PrismaClient();
const force = process.argv.includes('--force');
const delayMs = Number(process.env.EMBEDDING_DELAY_MS || 250);
const maxRetries = Number(process.env.EMBEDDING_MAX_RETRIES || 3);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(text, courseCode) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            return await aiService.generateEmbedding(text);
        } catch (error) {
            lastError = error;
            console.error(`[${courseCode}] Embedding attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            if (attempt < maxRetries) {
                await sleep(attempt * 1000);
            }
        }
    }
    throw lastError;
}

async function loadCourses() {
    if (force) {
        return prisma.course.findMany({ orderBy: { id: 'asc' } });
    }

    // Prisma cannot filter an Unsupported vector field directly, so use SQL here.
    return prisma.$queryRawUnsafe(`
        SELECT id, code, name, description, level, "offeredSemesters",
               "assessmentTypes", "workloadHours", "officialLink"
        FROM "Course"
        WHERE embedding IS NULL
        ORDER BY id ASC;
    `);
}

async function main() {
    console.log(`Starting course embedding initialization (${force ? 'full rebuild' : 'missing vectors only'})...`);
    const courses = await loadCourses();

    if (courses.length === 0) {
        console.log('No courses require embedding generation.');
        return;
    }

    console.log(`Found ${courses.length} course(s) to process.`);
    let succeeded = 0;
    let failed = 0;

    for (const course of courses) {
        const textToEmbed = buildCourseEmbeddingText(course);

        try {
            console.log(`Generating embedding for ${course.code}...`);
            const embedding = await generateWithRetry(textToEmbed, course.code);
            const vectorString = `[${embedding.join(',')}]`;

            await prisma.$executeRawUnsafe(
                `UPDATE "Course" SET embedding = $1::vector WHERE id = $2`,
                vectorString,
                course.id
            );
            succeeded += 1;
            console.log(`Embedding saved for ${course.code}.`);
        } catch (error) {
            failed += 1;
            console.error(`Skipping ${course.code}: ${error.message}`);
        }

        if (delayMs > 0) {
            await sleep(delayMs);
        }
    }

    console.log(`Embedding initialization finished. Succeeded: ${succeeded}; failed: ${failed}.`);
    if (failed > 0) {
        process.exitCode = 1;
    }
}

main()
    .catch((error) => {
        console.error('Embedding initialization failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
