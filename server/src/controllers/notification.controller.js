/**
 * Notification Controller
 * Handles notification API endpoints
 */

const notificationService = require('../services/notification.service');

/**
 * Get user notifications
 * GET /api/notifications
 * Query params: ?read=true/false, ?page=1, ?limit=20
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { read, page, limit } = req.query;

    const filters = {};
    if (read !== undefined) {
      filters.read = read === 'true' || read === true;
    }
    if (page) {
      filters.page = parseInt(page, 10) || 1;
    }
    if (limit) {
      filters.limit = parseInt(limit, 10) || 20;
    }

    const result = await notificationService.getUserNotifications(userId, filters);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;

    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark notification as read
 * POST /api/notifications/:id/mark-read
 */
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updated: result.count,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.deleteNotification(id, userId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
      notification,
    });
  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

