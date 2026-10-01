const test = require('node:test');
const assert = require('node:assert/strict');
const reviews = require('../src/services/reviewService');
const reviewController = require('../src/controllers/reviewController');
const aiController = require('../src/controllers/aiController');
const prisma = require('../src/lib/prisma');
const retrieval = require('../src/services/courseRetrievalService');
const llm = require('../src/services/llmService');
const { buildReviewSummaryEvidence } = require('../src/services/reviewSummaryEvidence');

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
function mockPrismaMethod(t, model, method, implementation) {
    const original = model[method];
    model[method] = t.mock.fn(implementation);
    t.after(() => { model[method] = original; });
}

test('review creation and editing preserve empty optional ratings as null', async t => {
    const body = { overallRating: 4, difficultyRating: 3, workloadRating: 2, teachingRating: null, usefulnessRating: null, assessmentStyle: null, comment: null };
    t.mock.method(reviews, 'createReview', async data => data);
    t.mock.method(reviews, 'updateReview', async (_user, _course, data) => data);
    for (const [handler, request] of [
        [reviewController.addReview, { user: { id: 1 }, body: { ...body, courseId: 1 } }],
        [reviewController.updateReview, { user: { id: 1 }, params: { courseId: '1' }, body }]
    ]) {
        const res = response();
        await handler(request, res);
        assert.ok(res.statusCode < 300);
        assert.equal(res.body.data.teachingRating, null);
        assert.equal(res.body.data.usefulnessRating, null);
    }
});

const candidate = { id: 1, code: '159.101', name: 'Programming', description: 'Programming practice', assessmentTypes: [], offeredSemesters: [] };
const validRecommendation = JSON.stringify({ summary: 'Programming practice.', recommendations: [{ courseId: 1, reasons: ['Programming practice matches your goal.'], cautions: ['Confirm offering details.'], completedCourseAnalysis: [] }] });
function mockRecommendationContext(t, answers) {
    mockPrismaMethod(t, prisma.user, 'findUnique', async () => ({ completedCourses: [], savedCourses: [] }));
    t.mock.method(retrieval, 'semanticSearchCourses', async () => [candidate]);
    return t.mock.method(llm, 'chatCompletion', async () => answers.shift());
}

test('AI recommendations accept complete JSON surrounded by explanatory text', async t => {
    const completion = mockRecommendationContext(t, [`Here is the result:\n${validRecommendation}\nDone.`]);
    const res = response();
    await aiController.aiRecommendCourses({ user: { id: 1 }, body: { query: 'Learn programming' } }, res);
    assert.equal(res.body.data.mode, 'ai');
    assert.equal(res.body.data.warning, undefined);
    assert.equal(completion.mock.callCount(), 1);
});

test('AI recommendations repair truncated or missing-course output once', async t => {
    const completion = mockRecommendationContext(t, ['{"recommendations":[]}', validRecommendation]);
    const res = response();
    await aiController.aiRecommendCourses({ user: { id: 1 }, body: { query: 'Learn programming' } }, res);
    assert.equal(completion.mock.callCount(), 2);
    assert.equal(res.body.data.mode, 'ai');
    assert.match(res.body.data.recommendations[0].reasons[0], /Programming practice/);
});

test('AI recommendations clearly label fallback after unsuccessful repair', async t => {
    const completion = mockRecommendationContext(t, ['truncated', 'truncated']);
    const res = response();
    await aiController.aiRecommendCourses({ user: { id: 1 }, body: { query: 'Learn programming' } }, res);
    assert.equal(completion.mock.callCount(), 2);
    assert.equal(res.body.data.mode, 'semantic');
    assert.match(res.body.data.warning, /incomplete/);
    assert.equal(res.body.data.recommendations[0].courseId, 1);
});

test('placeholder review comments cannot become claims about assessment', async t => {
    const data = [{ comment: 'test', overallRating: 4, workloadRating: 3, difficultyRating: 2, teachingRating: null, usefulnessRating: null }];
    assert.deepEqual(buildReviewSummaryEvidence(data).comments, []);
    mockPrismaMethod(t, prisma.review, 'findMany', async () => data);
    const completion = t.mock.method(llm, 'chatCompletion', async () => { throw new Error('LLM must not interpret placeholder evidence'); });
    const res = response();
    await aiController.getCourseSummary({ params: { id: '1' } }, res);
    assert.equal(completion.mock.callCount(), 0);
    assert.match(res.body.summary, /Workload rating 3.0\/5; difficulty rating 2.0\/5/);
    assert.doesNotMatch(res.body.summary, /exam concerns/);
});

test('short but meaningful opinions remain available to the summary', () => {
    assert.deepEqual(buildReviewSummaryEvidence([{ comment: 'Very useful' }, { comment: 'Testing was useful practice' }]).comments, ['Very useful', 'Testing was useful practice']);
});
