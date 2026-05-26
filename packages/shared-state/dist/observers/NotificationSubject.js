/**
 * Notification Subject (Observer Pattern)
 * Central event hub for notifications
 * Used by both Web and Mobile with identical subscription interface
 */
/**
 * NotificationSubject
 * Implements Observer pattern for event distribution
 *
 * Key principles:
 * 1. Single source of truth for notification events
 * 2. Identical subscription interface for Web/Mobile
 * 3. Decoupled from storage/API - just event distribution
 * 4. Thread-safe (handles concurrent subscriptions)
 */
export class NotificationSubject {
    subscribers = new Set();
    typeSubscribers = new Map();
    /**
     * Subscribe to all notification events
     */
    subscribe(handler) {
        this.subscribers.add(handler);
        return {
            unsubscribe: () => {
                this.subscribers.delete(handler);
            },
        };
    }
    /**
     * Subscribe to specific notification event type
     */
    subscribeToType(eventType, handler) {
        if (!this.typeSubscribers.has(eventType)) {
            this.typeSubscribers.set(eventType, new Set());
        }
        this.typeSubscribers.get(eventType).add(handler);
        return {
            unsubscribe: () => {
                const handlers = this.typeSubscribers.get(eventType);
                handlers?.delete(handler);
            },
        };
    }
    /**
     * Unsubscribe from all events
     */
    unsubscribe(handler) {
        this.subscribers.delete(handler);
        this.typeSubscribers.forEach((handlers) => handlers.delete(handler));
    }
    /**
     * Unsubscribe from specific event type
     */
    unsubscribeFromType(eventType, handler) {
        const handlers = this.typeSubscribers.get(eventType);
        handlers?.delete(handler);
    }
    /**
     * Emit notification event
     * Called internally by NotificationStore
     */
    notify(event) {
        // Notify all subscribers
        this.subscribers.forEach((handler) => {
            try {
                handler(event);
            }
            catch (error) {
                console.error("Error in notification subscriber:", error);
            }
        });
        // Notify type-specific subscribers
        const typeHandlers = this.typeSubscribers.get(event.type);
        if (typeHandlers) {
            typeHandlers.forEach((handler) => {
                try {
                    handler(event);
                }
                catch (error) {
                    console.error("Error in type-specific notification subscriber:", error);
                }
            });
        }
    }
    /**
     * Clear all subscribers (e.g., on logout)
     */
    clearSubscribers() {
        this.subscribers.clear();
        this.typeSubscribers.clear();
    }
    /**
     * Get subscriber count (for debugging)
     */
    getSubscriberCount() {
        return this.subscribers.size;
    }
    /**
     * Get type-specific subscriber count
     */
    getTypeSubscriberCount(eventType) {
        return this.typeSubscribers.get(eventType)?.size ?? 0;
    }
}
/**
 * Global notification subject instance
 * Singleton for entire application
 */
export const notificationSubject = new NotificationSubject();
//# sourceMappingURL=NotificationSubject.js.map