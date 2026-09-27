const test = require('node:test');
const assert = require('node:assert/strict');

const adminService = require('../../src/services/adminService');

test('admin statistics cover users, courses, reviews, plans, and reports', async () => {
    const stats = await adminService.getStats();
    const requiredFields = [
        'users',
        'courses',
        'activeCourses',
        'reviews',
        'pendingReviews',
        'plans',
        'reports',
        'pendingReports'
    ];

    for (const field of requiredFields) {
        assert.equal(Number.isInteger(stats[field]), true, `${field} should be an integer`);
        assert.equal(stats[field] >= 0, true, `${field} should not be negative`);
    }
    assert.equal(stats.activeCourses <= stats.courses, true);
    assert.equal(stats.pendingReviews <= stats.reviews, true);
    assert.equal(stats.pendingReports <= stats.reports, true);
});
