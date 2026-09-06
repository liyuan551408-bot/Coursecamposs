/** @file Translates ai HTTP requests into service calls and API responses. */
const aiService = require('../services/aiService');
const courseRetrievalService = require('../services/courseRetrievalService');
const llmService = require('../services/llmService');
const prisma = require('../lib/prisma');
const MAX_RESULT_LIMIT = 10;
const MAX_QUERY_LENGTH = 500;
const MAX_EMBEDDING_TEXT_LENGTH = 2000;
const VALID_SEMESTERS = new Set(['SEMESTER_1', 'SEMESTER_2', 'SUMMER']);
const VALID_ASSESSMENTS = new Set(['EXAM', 'ASSIGNMENT', 'QUIZ', 'PROJECT', 'LAB', 'PRESENTATION']);

/** Validate a required text field and enforce the API input length limit. */
const validateText = (value, field, maxLength) => {
    if (typeof value !== 'string' || value.trim() === '') {
        return `${field} must be a non-empty string`;
    }
    if (value.trim().length > maxLength) {
        return `${field} must be at most ${maxLength} characters`;
    }
    return null;
};

/** Normalize a requested result count to the safe API range of 1 to 10. */
const normalizeLimit = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(Math.max(Math.trunc(parsed), 1), MAX_RESULT_LIMIT);
};

/** Validate and normalize optional PostgreSQL course filters from the request body. */
const normalizeFilters = body => {
    const filters = {};
    if (body.semester !== undefined) {
        if (!VALID_SEMESTERS.has(body.semester)) return { error: 'Invalid semester filter' };
        filters.semester = body.semester;
    }
    if (body.assessmentType !== undefined) {
        if (!VALID_ASSESSMENTS.has(body.assessmentType)) return { error: 'Invalid assessmentType filter' };
        filters.assessmentType = body.assessmentType;
    }
    for (const field of ['minCredits', 'maxCredits', 'level']) {
        if (body[field] !== undefined) {
            const value = Number(body[field]);
            if (!Number.isInteger(value) || value < 0) return { error: `Invalid ${field} filter` };
            filters[field] = value;
        }
    }
    if (filters.minCredits !== undefined && filters.maxCredits !== undefined && filters.minCredits > filters.maxCredits) {
        return { error: 'minCredits cannot exceed maxCredits' };
    }
    return { filters };
};

/** Parse the model's JSON, keeping only recommendations that match retrieved courses. */
const parseRecommendationOutput = (raw, candidates) => {
    const candidateIds = new Set(candidates.map(course => course.id));
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
        const parsed = JSON.parse(cleaned);
        if (!parsed || !Array.isArray(parsed.recommendations)) throw new Error('Missing recommendations');
        const recommendations = parsed.recommendations
            .filter(item => candidateIds.has(Number(item.courseId)))
            .map(item => ({
                courseId: Number(item.courseId),
                reasons: Array.isArray(item.reasons) ? item.reasons.filter(reason => typeof reason === 'string').slice(0, 5) : [],
                cautions: Array.isArray(item.cautions) ? item.cautions.filter(caution => typeof caution === 'string').slice(0, 5) : []
            }));
        return {
            recommendations,
            summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 2000) : ''
        };
    } catch {
        return {
            recommendations: candidates.map(course => ({ courseId: course.id, reasons: [], cautions: [] })),
            summary: raw.slice(0, 2000)
        };
    }
};

/** Admin-only health check for the SiliconFlow embedding connection. */
const testEmbedding = async (req, res) => {
    try {
        const { text } = req.body || {};
        const textError = validateText(text, 'text', MAX_EMBEDDING_TEXT_LENGTH);
        if (textError) {
            return res.status(400).json({ success: false, error: textError });
        }

        const normalizedText = text.trim();
        console.log(`Received embedding generation request (${normalizedText.length} chars)`);
        const embeddingVector = await aiService.generateEmbedding(normalizedText);
        
        res.json({
            success: true,
            data: {
                dimension: embeddingVector.length,
                preview: embeddingVector.slice(0, 5)
            }
        });
    } catch (error) {
        console.error("Embedding generation failed:", error);
        res.status(500).json({ success: false, error: "Embedding generation service is temporarily unavailable" });
    }
};

/** Return semantically similar courses using the shared retrieval service. */
const semanticSearch = async (req, res) => {
    try {
        const { query, limit = 5 } = req.body || {};
        const filterResult = normalizeFilters(req.body || {});
        if (filterResult.error) return res.status(400).json({ success: false, error: filterResult.error });
        const safeLimit = normalizeLimit(limit, 5);
        const queryError = validateText(query, 'query', MAX_QUERY_LENGTH);

        if (queryError) {
            return res.status(400).json({ success: false, error: queryError });
        }

        const normalizedQuery = query.trim();
        console.log(`Received semantic search request (${normalizedQuery.length} chars)`);

        const formattedCourses = await courseRetrievalService.semanticSearchCourses({
            query: normalizedQuery,
            limit: safeLimit,
            ...filterResult.filters
        });

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

/** Retrieve candidates, ask GLM-4 for grounded reasons, and return structured recommendations. */
const aiRecommendCourses = async (req, res) => {
    try {
        const { query, limit = 3 } = req.body || {};
        const filterResult = normalizeFilters(req.body || {});
        if (filterResult.error) return res.status(400).json({ success: false, error: filterResult.error });
        const safeLimit = normalizeLimit(limit, 3);
        const queryError = validateText(query, 'query', MAX_QUERY_LENGTH);

        if (queryError) {
            return res.status(400).json({ success: false, error: queryError });
        }

        const normalizedQuery = query.trim();
        console.log(`Received AI recommendation request (${normalizedQuery.length} chars)`);

        const candidates = await courseRetrievalService.semanticSearchCourses({
            query: normalizedQuery,
            limit: safeLimit,
            ...filterResult.filters
        });

        if (candidates.length === 0) {
            return res.json({
                success: true,
                message: "No relevant candidate courses were found",
                data: { recommendations: [], aiAnalysis: "Sorry, there are no matching courses in the database yet." }
            });
        }

        const systemPrompt = `You are CourseCompass's intelligent course selection assistant.
Use only the course information supplied by the application.
Do not invent course facts or recommend courses outside the candidate list.
Base every recommendation on supplied evidence. If a requirement cannot be verified, say so clearly.
Distinguish semantic relevance from confirmed course facts. Keep the analysis concise and objective.
Return JSON only in this exact shape: {"summary":"...","recommendations":[{"courseId":1,"reasons":["..."],"cautions":["..."]}]}.
courseId must be copied from the supplied candidate data.`;
        
        const userContent = `Student requirements: "${normalizedQuery}"\n\nCandidate course data:\n` + JSON.stringify(candidates, null, 2);

        const aiAnalysis = await llmService.chatCompletion({
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
            temperature: 0.7
        });
        const structuredResult = parseRecommendationOutput(aiAnalysis, candidates);

        res.json({
            success: true,
            message: "AI recommendations and course analysis generated successfully",
            data: {
                candidateCourses: candidates,
                aiRationale: structuredResult.summary || aiAnalysis,
                recommendations: structuredResult.recommendations,
                summary: structuredResult.summary
            }
        });

    } catch (error) {
        console.error("AI recommendation failed:", error);
        res.status(500).json({ success: false, error: "AI recommendation service is temporarily unavailable" });
    }
};

/** Summarize approved course reviews using ratings and written comments as evidence. */
const getCourseSummary = async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);

        console.log(`Received course AI summary request, course ID: ${courseId}`);

        const reviews = await prisma.review.findMany({
            where: { 
                courseId: courseId,
                status: 'APPROVED'
            },
            select: {
                comment: true,
                overallRating: true,
                difficultyRating: true,
                workloadRating: true,
                teachingRating: true,
                usefulnessRating: true,
                assessmentStyle: true
            },
            take: 20
        });

        if (reviews.length === 0) {
            return res.json({ 
                success: true, 
                summary: "There are no reviews for this course yet. Be the first to share your real course experience!" 
            });
        }

        // Calculate an evidence-based average for each numeric review metric.
        const average = field => {
            const values = reviews.map(review => review[field]).filter(value => value !== null && value !== undefined);
            return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : 'Not available';
        };
        const styleCounts = reviews.reduce((counts, review) => {
            if (review.assessmentStyle) counts[review.assessmentStyle] = (counts[review.assessmentStyle] || 0) + 1;
            return counts;
        }, {});
        const assessmentSummary = Object.entries(styleCounts).map(([style, count]) => `${style}: ${count}`).join(', ') || 'Not available';
        const comments = reviews
            .filter(review => review.comment)
            .map((review, index) => `Comment ${index + 1}: ${review.comment}`)
            .join('\n') || 'No written comments provided.';
        const systemPrompt = `You are a university course selection guide. Generate a grounded, structured summary in English using only the supplied ratings and comments.
Use numerical ratings as the primary source for workload and difficulty. Use comments to explain recurring themes. Do not infer facts unsupported by the evidence. Keep it within 250 words and include Pros, Cons, and Workload & Difficulty.`;
        const userContent = `Review count: ${reviews.length}
Overall rating average: ${average('overallRating')}/5
Difficulty rating average: ${average('difficultyRating')}/5
Workload rating average: ${average('workloadRating')}/5
Teaching rating average: ${average('teachingRating')}/5
Usefulness rating average: ${average('usefulnessRating')}/5
Assessment styles: ${assessmentSummary}

${comments}`;
        const aiAnalysis = await llmService.chatCompletion({
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
            temperature: 0.5
        });

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
