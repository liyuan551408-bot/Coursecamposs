require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const aiService = require('../src/services/aiService'); 

const prisma = new PrismaClient();

async function main() {
    console.log('Starting batch generation of CourseCompass course semantic vectors...');
    try {
        const courses = await prisma.course.findMany();
        console.log(`Found ${courses.length} courses in the database. Preparing to process them...`);
        if (courses.length === 0) {
            console.log('There is no course data in the database yet. Please add test courses through the frontend or database panel first.');
            return;
        }
        for (const course of courses) {
            const descriptionText = course.description ? course.description : 'No detailed description yet';
            const textToEmbed = `Course code: ${course.code}. Course name: ${course.name}. Course description: ${descriptionText}`;
            console.log(`Calling Zhipu AI to process: [${course.code}] ${course.name}...`);
            const embeddingVector = await aiService.generateEmbedding(textToEmbed);
            const vectorString = `[${embeddingVector.join(',')}]`;
            await prisma.$executeRawUnsafe(
                `UPDATE "Course" SET embedding = $1::vector WHERE id = $2`,
                vectorString,
                course.id
            );

            console.log(`Course vector updated successfully: ${course.code}`);
        }
        console.log('All course vectors have been generated and updated.');

    } catch (error) {
        console.error('Script failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
