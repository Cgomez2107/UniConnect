import { useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { fetchNotifications } from "@/lib/services/notifications.service";
import NotificationItem from "@/components/notifications/NotificationItem";

export function NotificationsPage() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 dark:text-white">Notificaciones</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {unreadCount} sin leer
              </p>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">Sin notificaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notificacion={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
