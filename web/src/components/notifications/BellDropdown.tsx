import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { markAsRead, markAllAsRead } from "@/lib/services/notifications.service";
import type { Notification } from "@uniconnect/shared-types";

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const TYPE_ICONS: Record<string, string> = {
  message: "💬",
  studyGroupApplication: "📋",
  studyGroupAccepted: "✅",
  studyGroupRejected: "❌",
  mention: "@",
  friendRequest: "👤",
  system: "🔔",
};

export default function BellDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const storeMarkAsRead = useNotificationStore((s) => s.markAsRead);
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

  const handleMarkRead = async (n: Notification) => {
    if (n.read) return;
    try {
      await markAsRead(n.id);
      storeMarkAsRead(n.id);
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
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-elevated border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden">
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

          <div className="max-h-72 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No hay notificaciones
              </div>
            ) : (
              recent.map((n) => {
                const icon = TYPE_ICONS[n.type] ?? "🔔";
                return (
                  <button
                    key={n.id}
                    onClick={() => handleMarkRead(n)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors ${
                      !n.read ? "bg-primary-50/50 dark:bg-primary-900/10" : ""
                    }`}
                  >
                    <span className="text-lg mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          !n.read
                            ? "font-semibold text-neutral-900 dark:text-white"
                            : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {n.description}
                        </p>
                      )}
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary-600 mt-2 flex-shrink-0" />
                    )}
                  </button>
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