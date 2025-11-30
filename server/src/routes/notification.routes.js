/**
 * Notification Routes
 * Notification management endpoints
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const notificationPreferencesController = require('../controllers/notificationPreferences.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { notificationLimiter } = require('../middlewares/rateLimit.middleware');

/**
 * GET /api/notifications
 * Get user notifications
 * Query: ?read=true/false, ?page=1, ?limit=20
 */
router.get('/', notificationLimiter, authenticate, notificationController.getNotifications);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', notificationLimiter, authenticate, notificationController.getUnreadCount);

/**
 * POST /api/notifications/:id/mark-read
 * Mark notification as read
 */
router.post('/:id/mark-read', notificationLimiter, authenticate, notificationController.markAsRead);

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post('/mark-all-read', notificationLimiter, authenticate, notificationController.markAllAsRead);

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', notificationLimiter, authenticate, notificationController.deleteNotification);

/**
 * GET /api/notifications/preferences
 * Get notification preferences
 */
router.get('/preferences', notificationLimiter, authenticate, notificationPreferencesController.getPreferences);

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences
 */
router.patch('/preferences', notificationLimiter, authenticate, notificationPreferencesController.updatePreferences);

module.exports = router;

