/** @file Provides a small in-memory rate limiter for sensitive endpoints. */

const buckets = new Map();
const cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - (15 * 60 * 1000);
    for (const [key, bucket] of buckets) {
        if (bucket.startedAt < cutoff) buckets.delete(key);
    }
}, 15 * 60 * 1000);
cleanupTimer.unref();

const createRateLimiter = ({ windowMs, max, keyGenerator, message }) => (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now - current.startedAt >= windowMs) {
        buckets.set(key, { startedAt: now, count: 1 });
        return next();
    }

    current.count += 1;
    if (current.count > max) {
        const retryAfter = Math.ceil((windowMs - (now - current.startedAt)) / 1000);
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({ success: false, message });
    }

    return next();
};

const requestIdentity = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const forgotPasswordLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => `forgot:${requestIdentity(req)}`,
    message: 'Too many password reset requests. Please try again later.',
});

const resetPasswordLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => `reset:${requestIdentity(req)}`,
    message: 'Too many password reset attempts. Please try again later.',
});

module.exports = { forgotPasswordLimiter, resetPasswordLimiter };
