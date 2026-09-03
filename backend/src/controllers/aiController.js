const aiService = require('../services/aiService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SIMILARITY_THRESHOLD = 0.35;
const MAX_RESULT_LIMIT = 10;

const normalizeLimit = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(Math.max(Math.trunc(parsed), 1), MAX_RESULT_LIMIT);
};

const testEmbedding = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ success: false, error: "Please provide the text field to convert: 'text'" });
        }
        
        console.log(`Received embedding generation request: "${text}"`);
        const embeddingVector = await aiService.generateEmbedding(text);
        
        res.json({ success: true, data: embeddingVector });
    } catch (error) {
        console.error("Embedding generation failed:", error);
        res.status(500).json({ success: false, error: "Embedding generation service is temporarily unavailable" });
    }
};

const semanticSearch = async (req, res) => {
    try {
        const { query, limit = 5 } = req.body;
        const safeLimit = normalizeLimit(limit, 5);

        if (!query) {
            return res.status(400).json({ success: false, error: "Please provide the search term 'query'" });
        }

        console.log(`Received semantic search request: "${query}"`);

        const queryVector = await aiService.generateEmbedding(query);
        const vectorString = `[${queryVector.join(',')}]`;
        const courses = await prisma.$queryRawUnsafe(`
            SELECT id, code, name, description, level, "offeredSemesters",
                   "assessmentTypes", "workloadHours", "officialLink",
                   CAST(1 - (embedding <=> $1::vector) AS TEXT) AS similarity_text
            FROM "Course"
            WHERE embedding IS NOT NULL
              AND "isActive" = true
              AND 1 - (embedding <=> $1::vector) >= $2::float
            ORDER BY embedding <=> $1::vector
            LIMIT $3::int;
        `, vectorString, SIMILARITY_THRESHOLD, safeLimit);
        const formattedCourses = courses.map(course => ({
            id: course.id,
            code: course.code,
            name: course.name,
            description: course.description,
            level: course.level,
            offeredSemesters: course.offeredSemesters,
            assessmentTypes: course.assessmentTypes,
            workloadHours: course.workloadHours,
            officialLink: course.officialLink,
            similarity: course.similarity_text ? parseFloat(course.similarity_text) : 0
        }));

        res.json({
            success: true,
            message: `Found ${formattedCourses.length} relevant courses for you`,
            data: formattedCourses
        });

    } catch (error) {
        console.error("Semantic search failed:", error);
        res.status(500).json({ success: false, error: "AI search service is temporarily unavailable" });
    }
};

const aiRecommendCourses = async (req, res) => {
    try {
        const { query, limit = 3 } = req.body;
        const safeLimit = normalizeLimit(limit, 3);

        if (!query) {
            return res.status(400).json({ success: false, error: "Please provide the student's requirements in 'query'" });
        }

        console.log(`Received AI recommendation request: "${query}"`);

        const queryVector = await aiService.generateEmbedding(query);
        const vectorString = `[${queryVector.join(',')}]`;

        const courses = await prisma.$queryRawUnsafe(`
            SELECT id, code, name, description, level, "offeredSemesters",
                   "assessmentTypes", "workloadHours", "officialLink",
                   CAST(1 - (embedding <=> $1::vector) AS TEXT) AS similarity_text
            FROM "Course"
            WHERE embedding IS NOT NULL
              AND "isActive" = true
              AND 1 - (embedding <=> $1::vector) >= $2::float
            ORDER BY embedding <=> $1::vector
            LIMIT $3::int;
        `, vectorString, SIMILARITY_THRESHOLD, safeLimit);

        const candidates = courses.map(c => ({
            id: c.id,
            code: c.code,
            name: c.name,
            description: c.description,
            level: c.level,
            offeredSemesters: c.offeredSemesters,
            assessmentTypes: c.assessmentTypes,
            workloadHours: c.workloadHours,
            officialLink: c.officialLink,
            similarity: c.similarity_text ? parseFloat(c.similarity_text) : 0
        }));

        if (candidates.length === 0) {
            return res.json({
                success: true,
                message: "No relevant candidate courses were found",
                data: { recommendations: [], aiAnalysis: "Sorry, there are no matching courses in the database yet." }
            });
        }

        const systemPrompt = "You are CourseCompass's intelligent course selection assistant. Based on the student's requirements and the provided candidate course list, analyze why each course fits the student and generate a professional recommendation analysis with clear reasons in English. Stay objective, encouraging, and rigorous.";
        
        const userContent = `Student requirements: "${query}"\n\nCandidate course data:\n` + JSON.stringify(candidates, null, 2);

        const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.ZHIPU_API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                temperature: 0.7
            })
        });

        const aiData = await response.json();
        const aiAnalysis = aiData.choices?.[0]?.message?.content || "AI analysis generation failed";

        res.json({
            success: true,
            message: "AI recommendations and course analysis generated successfully",
            data: {
                candidateCourses: candidates,
                aiRationale: aiAnalysis
            }
        });

    } catch (error) {
        console.error("AI recommendation failed:", error);
        res.status(500).json({ success: false, error: "AI recommendation service is temporarily unavailable" });
    }
};

const getCourseSummary = async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);

        console.log(`Received course AI summary request, course ID: ${courseId}`);

        const reviews = await prisma.review.findMany({
            where: { 
                courseId: courseId,
                status: 'APPROVED', 
                comment: { not: null } 
            },
            select: { comment: true },
            take: 20
        });

        if (reviews.length === 0) {
            return res.json({ 
                success: true, 
                summary: "There are no reviews for this course yet. Be the first to share your real course experience!" 
            });
        }

        const combinedComments = reviews.map((r, index) => `Review ${index + 1}: ${r.comment}`).join('\n');

        const systemPrompt = "You are a university course selection guide. Based on the following real student reviews for a course, generate a structured summary report in English. Requirements: 1. Extract the course's key strengths (Pros). 2. Extract the main drawbacks or cautions (Cons). 3. Summarize the general workload and exam difficulty (Workload & Difficulty). Keep the tone objective and authentic, use clear formatting, and keep it within 250 words.";
        const userContent = `Here are the student reviews:\n${combinedComments}`;

        const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.ZHIPU_API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                temperature: 0.5
            })
        });

        const aiData = await response.json();
        const aiAnalysis = aiData.choices?.[0]?.message?.content || "AI analysis generation failed";

        res.json({ success: true, summary: aiAnalysis });

    } catch (error) {
        console.error("AI summary generation failed:", error);
        res.status(500).json({ success: false, error: "AI summary generation failed. Please try again later" });
    }
};

module.exports = {
    testEmbedding,
    semanticSearch,
    aiRecommendCourses,
    getCourseSummary
};
