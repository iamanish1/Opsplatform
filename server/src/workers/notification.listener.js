/**
 * Notification Listener
 * Listens to event bus and enqueues notification jobs
 */

const eventBus = require('../utils/eventBus');
const notificationQueue = require('../queues/notification.queue');

/**
 * Start the notification listener
 */
function start() {
  // Listen to all notification events
  eventBus.on('notification', async ({ eventType, data }) => {
    try {
      // Enqueue notification job
      await notificationQueue.add('process', {
        eventType,
        data,
      });

      console.log(`[Notification Listener] Enqueued notification job for event: ${eventType}`);
    } catch (error) {
      console.error(`[Notification Listener] Error enqueueing notification job:`, {
        error: error.message,
        eventType,
      });
    }
  });

  console.log('[Notification Listener] Started and listening to event bus');
}

module.exports = {
  start,
};

