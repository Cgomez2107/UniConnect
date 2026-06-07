import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, AlertCircle, Check, X } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { markAllAsRead } from "@/lib/services/notifications.service";
import type { Notification } from "@uniconnect/shared-types";
import { GATEWAY_BASE_URL, API_PREFIX } from "@/lib/api/client";

type Prioridad = "normal" | "urgente" | "critica";

interface NotificacionData {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  body?: string;
  read: boolean;
  createdAt: string;
  priority?: Prioridad;
  action?: { label: string; endpoint: string; method?: "GET" | "POST" | "PUT" | "DELETE" };
  data?: Record<string, any>;
}

const PRIORITY_STYLES: Record<Prioridad, { border: string; icon: string; bg: string; label: string; labelBg: string }> = {
  normal: { border: "border-l-primary-500", icon: "bg-primary-100 text-primary-600", bg: "", label: "", labelBg: "" },
  urgente: { border: "border-l-amber-500", icon: "bg-amber-100 text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10", label: "URGENTE", labelBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  critica: { border: "border-l-error-500", icon: "bg-error-100 text-error-600", bg: "bg-error-50 dark:bg-error-900/10", label: "CRÍTICA", labelBg: "bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300" },
};

function getPriorityIcon(priority?: Prioridad) {
  switch (priority) {
    case "urgente": return <AlertTriangle size={16} />;
    case "critica": return <AlertCircle size={16} />;
    default: return null;
  }
}

function isRejected(type: string): boolean {
  return type === "studyGroupRejected" || type === "application_rejected" || type === "miembro_rechazado" || type === "transferencia_admin_rechazada";
}

function isAccepted(type: string): boolean {
  return type === "studyGroupAccepted" || type === "application_accepted" || type === "miembro_aceptado" || type === "transferencia_admin_aceptada" || type === "transferencia_admin_transferida";
}

function isTransfer(type: string): boolean {
  return type === "transferencia_admin_solicitada";
}

function formatDate(date: string): string {
  try {
    const d = new Date(date);
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

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("uniconnect-auth-session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? parsed?.accessToken ?? null;
  } catch {
    return null;
  }
}

function getActionRoute(n: NotificacionData): string | null {
  const data = n.data ?? (n as any).payload;
  switch (n.type) {
    case "transferencia_admin_solicitada":
      return `/grupo/${data?.groupId ?? data?.requestId}?acceptTransfer=${data?.transferId}`;
    case "transferencia_admin_aceptada":
    case "transferencia_admin_transferida":
      return `/grupo/${data?.groupId}`;
    case "solicitud_ingreso":
      return `/solicitud/${data?.requestId}`;
    case "miembro_aceptado":
      return `/grupo/${data?.groupId ?? data?.requestId}`;
    default:
      if (data?.eventId) return `/eventos/${data.eventId}`;
      if (data?.groupId) return `/grupo/${data?.groupId}`;
      if (data?.requestId) return `/solicitud/${data?.requestId}`;
      return null;
  }
}

export default function BellDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifications = useNotificationStore((s) => s.notifications) as unknown as NotificacionData[];
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const storeMarkAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (n: NotificacionData) => {
    if (n.read) return;
    try {
      await fetch(`${GATEWAY_BASE_URL}${API_PREFIX}/notifications/${n.id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });
      markAsRead(n.id);
    } catch {
      console.error("Error marking notification as read:", n.id);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      storeMarkAllAsRead();
    } catch {
      console.error("Error marking all notifications as read");
    }
  };

  const handleNavigate = (n: NotificacionData) => {
    const route = getActionRoute(n);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  const recent = notifications.slice(0, 10);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} className="text-neutral-600 dark:text-neutral-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-error-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-neutral-800 rounded-lg shadow-elevated border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No hay notificaciones
              </div>
            ) : (
              recent.map((n, index) => {
                const priority = n.priority ?? "normal";
                const styles = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.normal;
                const route = getActionRoute(n);
                const desc = n.description ?? n.body;

                return (
                  <div
                    key={n.id ?? `bell-notification-${index}`}
                    className={`card p-4 flex items-start gap-3 border-l-4 ${styles.border} ${!n.read ? styles.bg : ""} hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors cursor-pointer`}
                    onClick={() => {
                      handleMarkRead(n);
                      if (route) handleNavigate(n);
                    }}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isRejected(n.type)
                        ? "bg-error-100 text-error-600"
                        : isAccepted(n.type)
                        ? "bg-success-100 text-success-600"
                        : styles.icon
                    }`}>
                      {getPriorityIcon(priority) ?? (
                        isRejected(n.type) ? <X size={16} />
                        : isAccepted(n.type) ? <Check size={16} />
                        : <Bell size={16} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden break-words">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-neutral-900 dark:text-white">
                          {n.title}
                        </p>
                        {priority !== "normal" && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${styles.labelBg}`}>
                            {styles.label}
                          </span>
                        )}
                      </div>
                      {desc && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5 break-words">
                          {desc}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                        {formatDate(n.createdAt)}
                      </p>

                      {route && (
                        <>
                          <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-700/50" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpen(false);
                              navigate(route);
                            }}
                            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                          >
                            {n.data?.eventId
                              ? "Ver evento →"
                              : isTransfer(n.type)
                              ? "Revisar solicitud →"
                              : n.type === "solicitud_ingreso"
                              ? "Ver solicitud →"
                              : "Ver grupo →"}
                          </button>
                        </>
                      )}
                    </div>

                    {!n.read && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              navigate("/notificaciones");
            }}
            className="w-full px-4 py-2.5 text-sm text-center text-primary-600 dark:text-primary-400 font-medium border-t border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
}