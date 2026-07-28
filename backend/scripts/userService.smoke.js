const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const prisma = require('../src/lib/prisma');
const userService = require('../src/services/userService');

const TEST_EMAIL = 'day2.student@coursecompass.test';
const TEST_PASSWORD = 'Day2Test123!';

const run = async () => {
    // 清理之前可能遗留的测试用户。
    await prisma.user.deleteMany({
        where: {
            email: TEST_EMAIL
        }
    });

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    // 测试创建用户。
    const createdUser = await userService.createUser({
        email: '  DAY2.Student@CourseCompass.Test  ',
        passwordHash,
        name: 'Day 2 Student',
        major: 'Software Engineering'
    });

    assert.equal(createdUser.email, TEST_EMAIL);
    assert.equal(createdUser.role, 'STUDENT');
    assert.equal('passwordHash' in createdUser, false);

    // 测试登录查询以及 email 大小写处理。
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

    // 测试公开资料不返回密码哈希。
    const publicUser = await userService.findPublicUserById(createdUser.id);

    assert.ok(publicUser);
    assert.equal('passwordHash' in publicUser, false);

    // 测试重复 email 唯一约束。
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
        // 测试结束后删除假用户。
        await prisma.user.deleteMany({
            where: {
                email: TEST_EMAIL
            }
        });

        await prisma.$disconnect();
    });