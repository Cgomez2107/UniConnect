import { deps } from "@/store/deps";
import { useNotificationStore } from "@/store/useNotificationStore";

export async function fetchNotifications() {
  try {
    const notifications = await deps.apiClients.notifications.list();
    useNotificationStore.getState().setNotifications(notifications);
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
