const assert = require('node:assert/strict');

const prisma = require('../src/lib/prisma');

const run = async () => {
    const algorithms = await prisma.course.findUnique({
        where: {
            code: '159.201'
        },
        select: {
            code: true,
            prerequisites: {
                select: {
                    id: true,
                    code: true
                },
                orderBy: {
                    code: 'asc'
                }
            }
        }
    });

    assert.ok(algorithms);
    assert.deepEqual(
        algorithms.prerequisites.map((course) => course.code),
        ['159.101']
    );

    const programmingProject = await prisma.course.findUnique({
        where: {
            code: '159.333'
        },
        select: {
            code: true,
            prerequisites: {
                select: {
                    id: true,
                    code: true
                },
                orderBy: {
                    code: 'asc'
                }
            }
        }
    });

    assert.ok(programmingProject);
    assert.deepEqual(
        programmingProject.prerequisites.map(
            (course) => course.code
        ),
        ['159.201', '159.272']
    );

    const courses = await prisma.course.findMany({
        select: {
            id: true,
            code: true,
            prerequisites: {
                select: {
                    id: true,
                    code: true
                }
            }
        }
    });

    for (const course of courses) {
        const hasSelfPrerequisite =
            course.prerequisites.some(
                (prerequisite) =>
                    prerequisite.id === course.id
            );

        assert.equal(
            hasSelfPrerequisite,
            false,
            `${course.code} cannot be its own prerequisite`
        );
    }

    console.log('Prerequisites smoke test passed.');
};

run()
    .catch((error) => {
        console.error('Prerequisites smoke test failed.');
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });