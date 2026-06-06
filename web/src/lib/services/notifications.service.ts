import { deps } from "@/store/deps";
import { useNotificationStore } from "@/store/useNotificationStore";

export async function fetchNotifications() {
  try {
    const apiNotifications = await deps.apiClients.notifications.list();
    const store = useNotificationStore.getState();
    const current = store.notifications;

    const seen = new Set<string>();
    const deduped: typeof apiNotifications = [];
    for (const n of apiNotifications) {
      if (!seen.has(n.id)) {
        seen.add(n.id);
        deduped.push(n);
      }
    }

    // Merge: keep client-side notifications (e.g. event alerts) that don't
    // exist on the server, so they don't get wiped by polling.
    // Then sort by createdAt descending so notifications always appear
    // in arrival order regardless of source (API vs local).
    const serverIds = new Set(deduped.map((n) => n.id));
    const merged = [
      ...deduped,
      ...current.filter((n) => !serverIds.has(n.id)),
    ].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });

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
