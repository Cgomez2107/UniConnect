import { deps } from "@/store/deps";
import { useNotificationStore } from "@/store/useNotificationStore";

export async function fetchNotifications() {
  try {
    const apiNotifications = await deps.apiClients.notifications.list();
    const store = useNotificationStore.getState();

    const apiIds = new Set(apiNotifications.map((n) => n.id));

    const localOnly = store.notifications.filter(
      (n) => n.id.startsWith("event-") && !apiIds.has(n.id),
    );

    const merged = [...apiNotifications, ...localOnly];
    store.setNotifications(merged);
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }
}

export async function markAsRead(notificationId: string) {
  await deps.apiClients.notifications.markAsRead(notificationId);
}

export async function markAllAsRead() {
  await deps.apiClients.notifications.markAllAsRead();
}
