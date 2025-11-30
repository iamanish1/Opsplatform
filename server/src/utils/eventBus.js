/**
 * Event Bus
 * Simple event emitter for internal events
 * Used to decouple event emission from notification processing
 */

const EventEmitter = require('events');

class EventBus extends EventEmitter {
  /**
   * Emit an event
   * @param {string} eventType - Event type (e.g., 'ScoreReady', 'PortfolioReady')
   * @param {Object} data - Event data
   */
  emit(eventType, data) {
    super.emit(eventType, data);
    // Also emit a generic 'notification' event for the listener
    super.emit('notification', { eventType, data });
  }
}

// Export singleton instance
module.exports = new EventBus();

