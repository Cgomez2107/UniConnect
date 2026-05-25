import { deps } from "@/store/deps";
import { useNotificationStore } from "@/store/useNotificationStore";

export async function fetchNotifications() {
  try {
    const apiNotifications = await deps.apiClients.notifications.list();
    const store = useNotificationStore.getState();

    const seen = new Set<string>();
    const deduped: typeof apiNotifications = [];
    for (const n of apiNotifications) {
      if (!seen.has(n.id)) {
        seen.add(n.id);
        deduped.push(n);
      }
    }

    store.setNotifications(deduped);
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

export async function getPreferences() {
  return deps.apiClients.notifications.getPreferences();
}

export async function updatePreference(body: {
  eventType: string;
  canal: string;
  active: boolean;
}) {
  await deps.apiClients.notifications.updatePreference(body as any);
}
