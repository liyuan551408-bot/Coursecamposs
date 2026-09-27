const test = require('node:test');
const assert = require('node:assert/strict');

const {
    attachCompletedCourseConnections,
    collectRelevantCompletedCourses
} = require('../src/services/completedCourseAnalysisService');

test('completed course analysis prioritizes prerequisites and adds same-subject foundations', () => {
    const candidates = [{
        id: 30,
        code: 'COMP300',
        subjectId: 1,
        prerequisites: [{ id: 10, code: 'COMP100', name: 'Programming Fundamentals' }]
    }];
    const completed = [
        { id: 20, code: 'COMP200', name: 'Data Structures', subjectId: 1, level: 200 },
        { id: 10, code: 'COMP100', name: 'Programming Fundamentals', subjectId: 1, level: 100 },
        { id: 40, code: 'MATH100', name: 'Mathematics', subjectId: 2 }
    ];

    const [result] = attachCompletedCourseConnections(candidates, completed);

    assert.deepEqual(result.completedCourseConnections, [
        { id: 10, code: 'COMP100', name: 'Programming Fundamentals', relationship: 'prerequisite' },
        { id: 20, code: 'COMP200', name: 'Data Structures', relationship: 'same_subject' }
    ]);
    assert.deepEqual(collectRelevantCompletedCourses([result]), [
        { id: 10, code: 'COMP100', name: 'Programming Fundamentals' },
        { id: 20, code: 'COMP200', name: 'Data Structures' }
    ]);
});

test('completed course analysis does not claim unrelated courses are relevant', () => {
    const [result] = attachCompletedCourseConnections(
        [{ id: 30, subjectId: 1, prerequisites: [] }],
        [{ id: 40, code: 'MATH100', name: 'Mathematics', subjectId: 2 }]
    );

    assert.deepEqual(result.completedCourseConnections, []);
    assert.deepEqual(collectRelevantCompletedCourses([result]), []);
});

test('completed course analysis does not present a higher-level course as a foundation', () => {
    const [result] = attachCompletedCourseConnections(
        [{ id: 30, subjectId: 1, level: 100, prerequisites: [] }],
        [{ id: 40, code: 'COMP300', name: 'Advanced Computing', subjectId: 1, level: 300 }]
    );

    assert.deepEqual(result.completedCourseConnections, []);
});
