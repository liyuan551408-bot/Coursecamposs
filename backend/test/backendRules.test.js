const assert = require('node:assert/strict');
const test = require('node:test');

const { validatePassword } = require('../src/utils/passwordPolicy');
const { forgotPasswordLimiter } = require('../src/middlewares/rateLimit');
const { getHealth } = require('../src/controllers/healthController');

const response = () => {
    const result = { statusCode: 200, body: null, headers: {} };
    return {
        result,
        status(code) { result.statusCode = code; return this; },
        json(body) { result.body = body; return this; },
        set(name, value) { result.headers[name] = value; return this; },
    };
};

test('password policy requires uppercase, lowercase, number, special character, and 8 characters', () => {
    assert.doesNotThrow(() => validatePassword('Course123!'));
    assert.throws(() => validatePassword('Course!abc'), /number/);
    assert.throws(() => validatePassword('course123!'), /uppercase/);
    assert.throws(() => validatePassword('COURSE123!'), /lowercase/);
    assert.throws(() => validatePassword('Course1234'), /special character/);
    assert.throws(() => validatePassword('Co1!abc'), /8 characters/);
});

test('forgot password limiter returns 429 after five requests from one IP', () => {
    const req = { ip: `test-${Date.now()}-${Math.random()}`, body: { email: 'student@example.com' } };
    for (let attempt = 0; attempt < 5; attempt += 1) {
        let nextCalled = false;
        forgotPasswordLimiter(req, response(), () => { nextCalled = true; });
        assert.equal(nextCalled, true);
    }
    const limited = response();
    forgotPasswordLimiter(req, limited, () => {});
    assert.equal(limited.result.statusCode, 429);
    assert.equal(limited.result.body.success, false);
    assert.ok(limited.result.headers['Retry-After']);
});

test('service health endpoint returns an OK response', () => {
    const result = response();
    getHealth({}, result);
    assert.deepEqual(result.result, { statusCode: 200, body: { success: true, status: 'ok' }, headers: {} });
});
