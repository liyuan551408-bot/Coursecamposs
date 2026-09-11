/** @file Exercises notification persistence and read-state transitions. */
const assert = require('node:assert/strict');
const prisma = require('../src/lib/prisma');
const notificationService = require('../src/services/notificationService');

const configuredUserId = Number(process.env.NOTIFICATION_TEST_USER_ID || 0);

const run = async () => {
    const user = configuredUserId > 0
        ? await prisma.user.findUnique({ where: { id: configuredUserId }, select: { id: true } })
        : await prisma.user.findFirst({ orderBy: { id: 'asc' }, select: { id: true } });
    if (!user) throw new Error('No test user found. Set NOTIFICATION_TEST_USER_ID to an existing user id.');
    try {
        const created = await notificationService.createNotifications([user.id], {
            type: 'SMOKE_TEST', title: 'Test notification', message: 'Notification persistence works.'
        });
        assert.equal(created.count, 1);

        const unread = await notificationService.listForUser(user.id, { unreadOnly: true });
        assert.equal(unread.items.length, 1);
        const notification = unread.items[0];

        const marked = await notificationService.markRead(user.id, notification.id);
        assert.equal(marked.count, 1);
        assert.equal((await notificationService.listForUser(user.id, { unreadOnly: true })).items.length, 0);

        await notificationService.createNotifications([user.id], {
            type: 'SMOKE_TEST', title: 'Second test notification', message: 'Read-all works.'
        });
        const markedAll = await notificationService.markAllRead(user.id);
        assert.equal(markedAll.count, 1);
        assert.equal((await notificationService.listForUser(user.id, { unreadOnly: true })).items.length, 0);
        console.log('Notification smoke test passed: create, list, mark-read, and mark-all-read.');
    } finally {
        await prisma.notification.deleteMany({ where: { userId: user.id, type: 'SMOKE_TEST' } });
    }
};

run().catch((error) => {
    console.error('Notification smoke test failed:', error);
    process.exitCode = 1;
}).finally(() => prisma.$disconnect());
