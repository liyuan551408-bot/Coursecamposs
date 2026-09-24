const test = require('node:test');
const assert = require('node:assert/strict');

const courseController = require('../src/controllers/courseController');
const notificationController = require('../src/controllers/notificationController');
const planController = require('../src/controllers/planController');
const savedCourseController = require('../src/controllers/savedCourseController');

const createResponse = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    }
});

test('course comparison rejects invalid course ids', async () => {
    const res = createResponse();

    await courseController.compareCourses(
        { body: { courseIds: [1, 'invalid'] } },
        res
    );

    assert.equal(res.statusCode, 400);
});

test('notification endpoints reject invalid pagination and ids', async () => {
    const pageResponse = createResponse();
    await notificationController.getNotifications(
        { query: { page: '1.5' }, user: { id: 1 } },
        pageResponse
    );
    assert.equal(pageResponse.statusCode, 400);

    const idResponse = createResponse();
    await notificationController.markNotificationRead(
        { params: { id: 'invalid' }, user: { id: 1 } },
        idResponse
    );
    assert.equal(idResponse.statusCode, 400);
});

test('saved course endpoints reject invalid course ids', async () => {
    const res = createResponse();

    await savedCourseController.addCourse(
        { body: { courseId: 'invalid' }, user: { id: 1 } },
        res
    );

    assert.equal(res.statusCode, 400);
});

test('plan endpoints reject invalid route ids', async () => {
    const res = createResponse();

    await planController.deletePlan(
        { params: { planId: 'invalid' }, user: { id: 1 } },
        res
    );

    assert.equal(res.statusCode, 400);
});
