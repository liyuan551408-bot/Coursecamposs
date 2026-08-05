const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const userService = require('../src/services/userService');
const TEST_EMAIL = 'day2.student@coursecompass.test';
const TEST_PASSWORD = 'Day2Test123!';
const run = async () => {
    await prisma.user.deleteMany({
        where: {
            email: TEST_EMAIL
        }
    });
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const createdUser = await userService.createUser({
        email: '  DAY2.Student@CourseCompass.Test  ',
        passwordHash,
        name: 'Day 2 Student',
        major: 'Software Engineering'
    });
    assert.equal(createdUser.email, TEST_EMAIL);
    assert.equal(createdUser.role, 'STUDENT');
    assert.equal('passwordHash' in createdUser, false);
    const authenticationUser =
        await userService.findUserForAuthenticationByEmail(
            'DAY2.STUDENT@COURSECOMPASS.TEST'
        );
    assert.ok(authenticationUser);
    assert.equal(authenticationUser.email, TEST_EMAIL);
    const passwordMatches = await bcrypt.compare(
        TEST_PASSWORD,
        authenticationUser.passwordHash
    );
    assert.equal(passwordMatches, true);
    const publicUser = await userService.findPublicUserById(createdUser.id);
    assert.ok(publicUser);
    assert.equal('passwordHash' in publicUser, false);
    await assert.rejects(
        () =>
            userService.createUser({
                email: TEST_EMAIL,
                passwordHash,
                name: 'Duplicate User'
            }),
        (error) => error.code === 'P2002'
    );
    console.log('User Service smoke test passed.');
};
run()
    .catch((error) => {
        console.error('User Service smoke test failed.');
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.user.deleteMany({
            where: {
                email: TEST_EMAIL
            }
        });
        await prisma.$disconnect();
    });