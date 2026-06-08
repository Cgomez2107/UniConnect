/**
 * Notification Store Factory
 * Creates Zustand notification store with Observer pattern
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { notificationSubject } from "../observers/index.js";
/**
 * Factory function - creates a new notification store instance
 * Integrates with NotificationSubject for event distribution
 */
export function createNotificationStore(deps, subject = notificationSubject) {
    const { storage, logger } = deps;
    return create()(persist((set, get) => ({
        // Initial state
        notifications: [],
        unreadCount: 0,
        // Add notification
        addNotification(notification) {
            const current = get();
            if (current.notifications.some((n) => n.id === notification.id))
                return;
            set((state) => ({
                notifications: [notification, ...state.notifications],
                unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount,
            }));
            logger?.info(`Notification added: ${notification.id}`);
            // Emit event via observer
            subject.notify({
                type: "notification:received",
                notification,
            });
        },
        // Remove notification
        removeNotification(notificationId) {
            const current = get();
            const notification = current.notifications.find((n) => n.id === notificationId);
            set((state) => {
                const filtered = state.notifications.filter((n) => n.id !== notificationId);
                const wasUnread = notification && !notification.read;
                return {
                    notifications: filtered,
                    unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
                };
            });
            logger?.info(`Notification removed: ${notificationId}`);
            // Emit event
            subject.notify({
                type: "notification:deleted",
                notificationIds: [notificationId],
            });
        },
        // Mark single notification as read
        markAsRead(notificationId) {
            const current = get();
            const notification = current.notifications.find((n) => n.id === notificationId);
            if (!notification)
                return;
            set((state) => ({
                notifications: state.notifications.map((n) => n.id === notificationId ? { ...n, read: true } : n),
                unreadCount: !notification.read ? state.unreadCount - 1 : state.unreadCount,
            }));
            logger?.info(`Notification marked as read: ${notificationId}`);
            // Emit event
            subject.notify({
                type: "notification:read",
                notification: { ...notification, read: true },
            });
        },
        // Mark all as read
        markAllAsRead() {
            const current = get();
            const unreadCount = current.notifications.filter((n) => !n.read).length;
            if (unreadCount === 0)
                return;
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, read: true })),
                unreadCount: 0,
            }));
            logger?.info(`All ${unreadCount} notifications marked as read`);
            // Emit event
            subject.notify({
                type: "notification:read",
                notificationIds: current.notifications.map((n) => n.id),
            });
        },
        // Clear all notifications
        clearAll() {
            set({
                notifications: [],
                unreadCount: 0,
            });
            logger?.info("All notifications cleared");
            // Emit event
            subject.notify({
                type: "notification:cleared",
            });
        },
        // Set notifications directly (bulk operation)
        setNotifications(notifications) {
            const unreadCount = notifications.filter((n) => !n.read).length;
            set({
                notifications,
                unreadCount,
            });
            logger?.info(`Notifications set: ${notifications.length} total, ${unreadCount} unread`);
        },
        // Hydrate from persistent storage
        async hydrate() {
            try {
                const storedNotifications = await storage.getItem("notifications:store");
                if (storedNotifications) {
                    const parsed = JSON.parse(storedNotifications);
                    const notifications = parsed.notifications ?? parsed;
                    const unreadCount = notifications.filter((n) => !n.read).length;
                    set({
                        notifications,
                        unreadCount,
                    });
                    logger?.info(`Notifications hydrated: ${notifications.length} total, ${unreadCount} unread`);
                }
            }
            catch (error) {
                logger?.error("Error hydrating notifications:", error);
            }
        },
    }), {
        name: "notifications:store",
        storage: {
            getItem: async (name) => {
                const item = await storage.getItem(name);
                return item ? JSON.parse(item) : null;
            },
            setItem: async (name, value) => {
                await storage.setItem(name, JSON.stringify(value));
            },
            removeItem: async (name) => {
                await storage.removeItem(name);
            },
        },
        partialize: (state) => ({
            notifications: state.notifications
                .filter((n) => !n.id?.startsWith("toast-"))
                .map((n) => ({
                ...n,
                description: n.description ?? n.body ?? undefined,
                read: n.read ?? (n.readAt != null || n.read_at != null),
            })),
            unreadCount: state.unreadCount,
        }),
        migrate: (persistedState, version) => {
            if (persistedState?.notifications) {
                persistedState.notifications = persistedState.notifications
                    .filter((n) => !n.id?.startsWith("toast-"))
                    .map((n) => ({
                    ...n,
                    description: n.description ?? n.body ?? undefined,
                    read: n.read ?? (n.readAt != null || n.read_at != null),
                }));
                persistedState.unreadCount = persistedState.notifications.filter((n) => !n.read).length;
            }
            return persistedState;
        },
    }));
}
//# sourceMappingURL=createNotificationStore.js.map