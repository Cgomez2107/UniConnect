/**
 * Notification Subject (Observer Pattern)
 * Central event hub for notifications
 * Used by both Web and Mobile with identical subscription interface
 */
import type { Notification } from "@uniconnect/shared-types";
export type NotificationEventType = "notification:received" | "notification:read" | "notification:deleted" | "notification:cleared";
export interface NotificationEvent {
    type: NotificationEventType;
    notification?: Notification;
    notificationIds?: string[];
}
export type NotificationHandler = (event: NotificationEvent) => void;
export interface Subscription {
    unsubscribe(): void;
}
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
export declare class NotificationSubject {
    private subscribers;
    private typeSubscribers;
    /**
     * Subscribe to all notification events
     */
    subscribe(handler: NotificationHandler): Subscription;
    /**
     * Subscribe to specific notification event type
     */
    subscribeToType(eventType: NotificationEventType, handler: NotificationHandler): Subscription;
    /**
     * Unsubscribe from all events
     */
    unsubscribe(handler: NotificationHandler): void;
    /**
     * Unsubscribe from specific event type
     */
    unsubscribeFromType(eventType: NotificationEventType, handler: NotificationHandler): void;
    /**
     * Emit notification event
     * Called internally by NotificationStore
     */
    notify(event: NotificationEvent): void;
    /**
     * Clear all subscribers (e.g., on logout)
     */
    clearSubscribers(): void;
    /**
     * Get subscriber count (for debugging)
     */
    getSubscriberCount(): number;
    /**
     * Get type-specific subscriber count
     */
    getTypeSubscriberCount(eventType: NotificationEventType): number;
}
/**
 * Global notification subject instance
 * Singleton for entire application
 */
export declare const notificationSubject: NotificationSubject;
//# sourceMappingURL=NotificationSubject.d.ts.map