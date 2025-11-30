const prisma = require('../prisma/client');

/**
 * Create notification
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.userId - User ID
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type
 * @param {Object} notificationData.data - Optional data payload
 * @returns {Promise<Object>} Created notification
 */
async function create(notificationData) {
  const { userId, title, message, type, data } = notificationData;

  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      data: data || null,
      read: false,
      emailSent: false,
    },
  });
}

/**
 * Find notifications by user ID
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters
 * @param {boolean} filters.read - Filter by read status
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Results per page (default: 20)
 * @returns {Promise<Object>} Paginated notifications
 */
async function findByUserId(userId, filters = {}) {
  const { read, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    userId,
  };

  if (read !== undefined) {
    where.read = read === true || read === 'true';
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Find notification by ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object|null>} Notification or null
 */
async function findById(notificationId) {
  return prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
  });
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
async function markAsRead(notificationId) {
  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      read: true,
    },
  });
}

/**
 * Mark all user notifications as read
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update count
 */
async function markAllAsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  return result;
}

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Deleted notification
 */
async function deleteNotification(notificationId) {
  return prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });
}

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Update email sent status
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
async function updateEmailSent(notificationId) {
  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      emailSent: true,
    },
  });
}

module.exports = {
  create,
  findByUserId,
  findById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  updateEmailSent,
};

