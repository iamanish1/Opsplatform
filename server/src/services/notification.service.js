/**
 * Notification Service
 * Business logic for notifications
 */

const notificationRepo = require('../repositories/notification.repo');

/**
 * Create in-app notification
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} data - Optional data payload
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(userId, type, title, message, data = null) {
  return notificationRepo.create({
    userId,
    type,
    title,
    message,
    data,
  });
}

/**
 * Get user notifications with pagination
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options
 * @param {boolean} filters.read - Filter by read status
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Results per page
 * @returns {Promise<Object>} Paginated notifications
 */
async function getUserNotifications(userId, filters = {}) {
  return notificationRepo.findByUserId(userId, filters);
}

/**
 * Mark notification as read (with ownership check)
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for ownership check)
 * @returns {Promise<Object>} Updated notification
 */
async function markAsRead(notificationId, userId) {
  // Verify ownership
  const notification = await notificationRepo.findById(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new Error('Unauthorized: This notification does not belong to you');
  }

  return notificationRepo.markAsRead(notificationId);
}

/**
 * Mark all user notifications as read
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
async function markAllAsRead(userId) {
  return notificationRepo.markAllAsRead(userId);
}

/**
 * Delete notification (with ownership check)
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for ownership check)
 * @returns {Promise<Object>} Deleted notification
 */
async function deleteNotification(notificationId, userId) {
  // Verify ownership
  const notification = await notificationRepo.findById(notificationId);
  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new Error('Unauthorized: This notification does not belong to you');
  }

  return notificationRepo.deleteNotification(notificationId);
}

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
async function getUnreadCount(userId) {
  return notificationRepo.getUnreadCount(userId);
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};

