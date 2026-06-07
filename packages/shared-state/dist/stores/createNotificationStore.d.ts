/**
 * Notification Store Factory
 * Creates Zustand notification store with Observer pattern
 */
import type { Notification } from "@uniconnect/shared-types";
import { NotificationSubject } from "../observers/index.js";
import type { StoreDeps } from "../types/index.js";
export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    addNotification(notification: Notification): void;
    removeNotification(notificationId: string): void;
    markAsRead(notificationId: string): void;
    markAllAsRead(): void;
    clearAll(): void;
    setNotifications(notifications: Notification[]): void;
    hydrate(): Promise<void>;
}
/**
 * Factory function - creates a new notification store instance
 * Integrates with NotificationSubject for event distribution
 */
export declare function createNotificationStore(deps: StoreDeps, subject?: NotificationSubject): import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<NotificationState>, "setState" | "persist"> & {
    setState(partial: NotificationState | Partial<NotificationState> | ((state: NotificationState) => NotificationState | Partial<NotificationState>), replace?: false | undefined): unknown;
    setState(state: NotificationState | ((state: NotificationState) => NotificationState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<NotificationState, any, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: NotificationState) => void) => () => void;
        onFinishHydration: (fn: (state: NotificationState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<NotificationState, any, unknown>>;
    };
}>;
//# sourceMappingURL=createNotificationStore.d.ts.map