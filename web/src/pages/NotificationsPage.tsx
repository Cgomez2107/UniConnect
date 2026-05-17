import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, X } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { fetchNotifications } from "@/lib/services/notifications.service";

function formatDate(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function isRejected(type: string): boolean {
  return type === "studyGroupRejected" || type === "application_rejected";
}

function isAccepted(type: string): boolean {
  return type === "studyGroupAccepted" || type === "application_accepted";
}

function isTransfer(type: string): boolean {
  return type === "transferencia_admin_solicitada" || type === "friendRequest";
}

export function NotificationsPage() {
  const navigate = useNavigate();
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
              <div
                key={n.id}
                className={`card p-4 flex items-start gap-3 ${
                  !n.read ? "border-l-4 border-l-primary-500" : ""
                }`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isRejected(n.type)
                    ? "bg-error-100 text-error-600"
                    : isAccepted(n.type)
                    ? "bg-success-100 text-success-600"
                    : "bg-primary-100 text-primary-600"
                }`}>
                  {isRejected(n.type) ? (
                    <X size={16} />
                  ) : isAccepted(n.type) ? (
                    <Check size={16} />
                  ) : (
                    <Bell size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary-900 dark:text-white text-sm">
                    {n.title}
                  </p>
                  {n.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5">
                      {n.description}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    {formatDate(n.createdAt)}
                  </p>
                  {isTransfer(n.type) && n.data?.requestId && (
                    <button
                      onClick={() => navigate(`/grupo/${n.data?.requestId}?acceptTransfer=${n.data?.transferId}`)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1"
                    >
                      Ver grupo →
                    </button>
                  )}
                  {!isTransfer(n.type) && !isRejected(n.type) && !isAccepted(n.type) && n.data?.requestId && (
                    <button
                      onClick={() => navigate(`/solicitud/${n.data?.requestId}`)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1"
                    >
                      Ver solicitud →
                    </button>
                  )}
                </div>
                {!n.read && (
                  <span className="shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
