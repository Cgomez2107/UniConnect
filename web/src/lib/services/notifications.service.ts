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

    const apiIds = new Set(deduped.map((n) => n.id));

    const currentSnapshot = store.notifications;
    const removedFromServer = currentSnapshot.filter(
      (n) => !n.id.startsWith("event-") && !apiIds.has(n.id),
    );
    for (const n of removedFromServer) {
      store.removeNotification(n.id);
    }

    const existingIds = new Set(store.notifications.map((n) => n.id));
    for (const n of deduped) {
      if (!existingIds.has(n.id)) {
        store.addNotification(n);
        existingIds.add(n.id);
      }
    }
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
