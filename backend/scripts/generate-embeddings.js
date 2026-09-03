require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const aiService = require('../src/services/aiService'); 

const prisma = new PrismaClient();

async function main() {
    console.log('开始批量生成 CourseCompass 课程语义向量...');
    try {
        const courses = await prisma.course.findMany();
        console.log(`共在数据库中找到 ${courses.length} 门课程，准备处理...`);
        if (courses.length === 0) {
            console.log('数据库里还没有课程数据，请先通过前端或数据库面板添加一些测试课程！');
            return;
        }
        for (const course of courses) {
            const descriptionText = course.description ? course.description : '暂无详细描述';
            const textToEmbed = `课程代码：${course.code}。课程名称：${course.name}。课程描述：${descriptionText}`;
            console.log(`正在调用智谱 AI 处理: [${course.code}] ${course.name}...`);
            const embeddingVector = await aiService.generateEmbedding(textToEmbed);
            const vectorString = `[${embeddingVector.join(',')}]`;
            await prisma.$executeRawUnsafe(
                `UPDATE "Course" SET embedding = $1::vector WHERE id = $2`,
                vectorString,
                course.id
            );

            console.log(`成功更新课程向量: ${course.code}`);
        }
        console.log('所有课程的向量生成与更新已全部完成！');

    } catch (error) {
        console.error('脚本运行出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();