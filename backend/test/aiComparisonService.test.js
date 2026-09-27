const test = require('node:test');
const assert = require('node:assert/strict');

const {
    InvalidAiComparisonError,
    parseAiJsonResponse,
    validateCompareResponse,
    generateComparisonAnalysis,
    buildSystemPrompt
} = require('../src/services/aiComparisonService');

const courses = [
    { id: 1, code: '159.101', name: 'Programming Fundamentals' },
    { id: 2, code: '159.201', name: 'Algorithms' },
    { id: 3, code: '159.235', name: 'Networks' },
    { id: 4, code: '159.302', name: 'Artificial Intelligence' }
];

const validPayload = () => ({
    summary: 'These courses build a broad computing pathway.',
    relationships: [{
        type: 'prerequisite',
        courseIds: [1, 2],
        description: 'Programming fundamentals prepare students for algorithms.'
    }],
    learningOrder: courses.map(course => ({ courseId: course.id, reason: `Study ${course.code} at this stage.` })),
    strengths: ['Broad coverage'],
    tradeoffs: ['High combined workload'],
    recommendation: 'Follow the proposed order.',
    limitations: 'Confirm official prerequisite rules.'
});

test('parses fenced JSON and ignores surrounding explanatory text', () => {
    const payload = validPayload();
    assert.deepEqual(parseAiJsonResponse(`Here is the result:\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`\nDone.`), payload);
});

test('validates all selected courses exactly once in learning order', () => {
    const result = validateCompareResponse(validPayload(), courses);
    assert.deepEqual(result.learningOrder.map(item => item.courseId), [1, 2, 3, 4]);

    const incomplete = validPayload();
    incomplete.learningOrder = incomplete.learningOrder.slice(0, 2);
    assert.throws(() => validateCompareResponse(incomplete, courses), InvalidAiComparisonError);

    const duplicate = validPayload();
    duplicate.learningOrder[3].courseId = 3;
    assert.throws(() => validateCompareResponse(duplicate, courses), InvalidAiComparisonError);
});

test('retries invalid output once with a repair prompt', async () => {
    const responses = ['not-json', JSON.stringify(validPayload())];
    const calls = [];
    const result = await generateComparisonAnalysis({
        courses,
        chatCompletion: async options => {
            calls.push(options);
            return responses.shift();
        }
    });
    assert.equal(calls.length, 2);
    assert.match(calls[1].messages[0].content, /Repair it now/);
    assert.deepEqual(result.learningOrder.map(item => item.courseId), [1, 2, 3, 4]);
});

test('fails cleanly after exactly one repair attempt', async () => {
    let calls = 0;
    await assert.rejects(
        generateComparisonAnalysis({
            courses,
            chatCompletion: async () => {
                calls += 1;
                return '{"summary":"still incomplete"}';
            }
        }),
        error => error.code === 'AI_COMPARE_INVALID_RESPONSE'
    );
    assert.equal(calls, 2);
});

test('prompt explicitly lists every selected course', () => {
    const prompt = buildSystemPrompt(courses);
    for (const course of courses) {
        assert.match(prompt, new RegExp(`${course.id}: ${course.code.replace('.', '\\.')}`));
    }
    assert.match(prompt, /every selected course ID exactly once/);
});
