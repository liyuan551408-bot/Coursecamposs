const aiService = require('../services/aiService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testEmbedding = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: "请提供需要转换的文本字段 'text'" });
        }
        
        console.log(`收到向量生成请求: "${text}"`);
        const embeddingVector = await aiService.generateEmbedding(text);
        
        res.json({ success: true, data: embeddingVector });
    } catch (error) {
        console.error("向量生成失败:", error);
        res.status(500).json({ success: false, error: "向量生成服务暂时不可用" });
    }
};

const semanticSearch = async (req, res) => {
    try {
        const { query, limit = 5 } = req.body;

        if (!query) {
            return res.status(400).json({ success: false, error: "请提供搜索词 'query'" });
        }

        console.log(`收到语义搜索请求: "${query}"`);

        const queryVector = await aiService.generateEmbedding(query);
        const vectorString = `[${queryVector.join(',')}]`;
        const courses = await prisma.$queryRawUnsafe(`
            SELECT id, code, name, description, 
                   CAST(1 - (embedding <=> $1::vector) AS TEXT) AS similarity_text
            FROM "Course"
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT $2::int;
        `, vectorString, limit);
        const formattedCourses = courses.map(course => ({
            id: course.id,
            code: course.code,
            name: course.name,
            description: course.description,
            similarity: course.similarity_text ? parseFloat(course.similarity_text) : 0
        }));

        res.json({
            success: true,
            message: `成功为您找到 ${formattedCourses.length} 门相关课程`,
            data: formattedCourses
        });

    } catch (error) {
        console.error("语义搜索执行失败:", error);
        res.status(500).json({ success: false, error: "AI 搜索服务暂时不可用" });
    }
};

const aiRecommendCourses = async (req, res) => {
    try {
        const { query, limit = 3 } = req.body;

        if (!query) {
            return res.status(400).json({ success: false, error: "请提供学生的需求描述 'query'" });
        }

        console.log(`收到 AI 智能推荐请求: "${query}"`);

        const queryVector = await aiService.generateEmbedding(query);
        const vectorString = `[${queryVector.join(',')}]`;

        const courses = await prisma.$queryRawUnsafe(`
            SELECT id, code, name, description, 
                   CAST(1 - (embedding <=> $1::vector) AS TEXT) AS similarity_text
            FROM "Course"
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT $2::int;
        `, vectorString, limit);

        const candidates = courses.map(c => ({
            id: c.id,
            code: c.code,
            name: c.name,
            description: c.description,
            similarity: c.similarity_text ? parseFloat(c.similarity_text) : 0
        }));

        if (candidates.length === 0) {
            return res.json({
                success: true,
                message: "没有找到相关的候选课程",
                data: { recommendations: [], aiAnalysis: "抱歉，数据库中暂无匹配的课程信息。" }
            });
        }

        const systemPrompt = "你是 CourseCompass 的智能选课助手。请根据学生的需求以及提供的候选课程列表，分析每门课为什么适合该学生，并生成一段专业的中文推荐分析与理由。请保持客观、鼓励和严谨。";
        
        const userContent = `学生需求: "${query}"\n\n候选课程数据:\n` + JSON.stringify(candidates, null, 2);

        const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.ZHIPU_API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4", // 使用智谱的标准大模型
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                temperature: 0.7
            })
        });

        const aiData = await response.json();
        const aiAnalysis = aiData.choices?.[0]?.message?.content || "AI 分析生成失败";

        res.json({
            success: true,
            message: "成功生成 AI 智能推荐与选课分析",
            data: {
                candidateCourses: candidates,
                aiRationale: aiAnalysis
            }
        });

    } catch (error) {
        console.error("AI 智能推荐执行失败:", error);
        res.status(500).json({ success: false, error: "AI 推荐服务暂时不可用" });
    }
};

module.exports = {
    testEmbedding,
    semanticSearch,
    aiRecommendCourses 
};
