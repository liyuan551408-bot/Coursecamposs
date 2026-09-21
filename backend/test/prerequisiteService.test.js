const assert = require('node:assert/strict');
const test = require('node:test');
const { resolvePrerequisiteCourses } = require('../src/services/prerequisiteService');

const courses = [
    { id: 7, code: '159.101' },
    { id: 8, code: 'COMP102' },
    { id: 159101, code: 'OTHER' }
];
const prisma = {
    course: {
        findMany: async ({ where }) => courses.filter((course) => where.OR.some((filter) =>
            filter.id?.in.includes(course.id) || filter.code?.in.includes(course.code)
        ))
    }
};

test('resolves IDs, codes, and six-digit aliases without duplicate connections', async () => {
    const resolved = await resolvePrerequisiteCourses(prisma, ['159101', '159.101', 'comp102', '8']);
    assert.deepEqual(resolved.map((course) => course.id), [7, 8]);
});

test('reports unresolved prerequisites and accepts an empty list', async () => {
    assert.deepEqual(await resolvePrerequisiteCourses(prisma, []), []);
    await assert.rejects(
        resolvePrerequisiteCourses(prisma, ['COMP102', 'MISSING101']),
        (error) => error.code === 'PREREQUISITE_NOT_FOUND'
            && error.meta.missing[0] === 'MISSING101'
    );
});
