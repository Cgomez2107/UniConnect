import { useNavigate } from "react-router-dom";
import { Bell, Check, X, AlertTriangle, AlertCircle } from "lucide-react";
import type { Prioridad, Accion } from "@/types";

interface NotificacionData {
  id: string;
  type: string;
  title: string;
  description?: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
  priority?: Prioridad;
  action?: Accion;
}

interface Props {
  notificacion: NotificacionData;
}

const PRIORITY_STYLES: Record<Prioridad, { border: string; icon: string; bg: string; text: string }> = {
  normal: { border: "border-l-primary-500", icon: "bg-primary-100 text-primary-600", bg: "", text: "" },
  urgente: { border: "border-l-amber-500", icon: "bg-amber-100 text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10", text: "text-amber-700 dark:text-amber-300" },
  critica: { border: "border-l-error-500", icon: "bg-error-100 text-error-600", bg: "bg-error-50 dark:bg-error-900/10", text: "text-error-700 dark:text-error-300" },
};

function getPriorityIcon(priority?: Prioridad) {
  switch (priority) {
    case "urgente": return <AlertTriangle size={16} />;
    case "critica": return <AlertCircle size={16} />;
    default: return null;
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

export function NotificationItem({ notificacion: n }: Props) {
  const navigate = useNavigate();
  const priority = n.priority ?? "normal";
  const styles = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.normal;

  return (
    <div
      className={`card p-4 flex items-start gap-3 border-l-4 ${styles.border} ${!n.read ? styles.bg : ""}`}
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

      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${styles.text} ${!n.read ? "text-primary-900 dark:text-white" : "text-neutral-600 dark:text-neutral-300"}`}>
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

        <div className="flex flex-wrap gap-2 mt-2">
          {n.action && (
            <button
              onClick={() => navigate(n.action!.endpoint)}
              className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/30 font-medium px-3 py-1 rounded-full transition-colors"
            >
              {n.action.label}
            </button>
          )}
          {isTransfer(n.type) && !n.action && (n.data?.groupId ?? n.data?.requestId) && (
            <button
              onClick={() => navigate(`/grupo/${n.data?.groupId ?? n.data?.requestId}?acceptTransfer=${n.data?.transferId}`)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver grupo →
            </button>
          )}
          {!isTransfer(n.type) && !isRejected(n.type) && !isAccepted(n.type) && !n.action && n.data?.requestId && (
            <button
              onClick={() => navigate(`/solicitud/${n.data?.requestId}`)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver solicitud →
            </button>
          )}
        </div>
      </div>

      {!n.read && (
        <span className="shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2" />
      )}
    </div>
  );
}

export default NotificationItem;
