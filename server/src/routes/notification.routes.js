/**
 * Notification Routes
 * Notification management endpoints
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const notificationPreferencesController = require('../controllers/notificationPreferences.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * GET /api/notifications
 * Get user notifications
 * Query: ?read=true/false, ?page=1, ?limit=20
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

/**
 * POST /api/notifications/:id/mark-read
 * Mark notification as read
 */
router.post('/:id/mark-read', authenticate, notificationController.markAsRead);

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post('/mark-all-read', authenticate, notificationController.markAllAsRead);

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', authenticate, notificationController.deleteNotification);

/**
 * GET /api/notifications/preferences
 * Get notification preferences
 */
router.get('/preferences', authenticate, notificationPreferencesController.getPreferences);

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences
 */
router.patch('/preferences', authenticate, notificationPreferencesController.updatePreferences);

module.exports = router;

