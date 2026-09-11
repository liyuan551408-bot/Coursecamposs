/** @file Handles authenticated notification requests. */
const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
    try {
        const unreadOnly = String(req.query.unreadOnly) === 'true';
        const data = await notificationService.listForUser(req.user.id, { unreadOnly, page: req.query.page, limit: req.query.limit });
        return res.json({ success: true, ...data });
    } catch (error) {
        console.error('Notification query failed:', error);
        return res.status(500).json({ success: false, message: 'Unable to load notifications' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const result = await notificationService.markRead(req.user.id, req.params.id);
        return res.json({ success: true, updated: result.count > 0 });
    } catch (error) {
        console.error('Notification read update failed:', error);
        return res.status(500).json({ success: false, message: 'Unable to update notification' });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        const result = await notificationService.markAllRead(req.user.id);
        return res.json({ success: true, updated: result.count });
    } catch (error) {
        console.error('All notifications read update failed:', error);
        return res.status(500).json({ success: false, message: 'Unable to update notifications' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const result = await notificationService.deleteOne(req.user.id, req.params.id);
        return res.json({ success: true, deleted: result.count > 0 });
    } catch (error) {
        console.error('Notification delete failed:', error);
        return res.status(500).json({ success: false, message: 'Unable to delete notification' });
    }
};

const deleteAllNotifications = async (req, res) => {
    try {
        const result = await notificationService.deleteAll(req.user.id);
        return res.json({ success: true, deleted: result.count });
    } catch (error) {
        console.error('All notifications delete failed:', error);
        return res.status(500).json({ success: false, message: 'Unable to delete notifications' });
    }
};

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteAllNotifications };
