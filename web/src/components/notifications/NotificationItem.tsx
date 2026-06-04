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

function getActionLabel(n: NotificacionData): string | null {
  if (n.action?.label) return n.action.label;
  const route = getActionRoute(n);
  if (!route) return null;
  if (n.data?.eventId) return "Ver evento →";
  if (isTransfer(n.type)) return "Revisar solicitud →";
  if (n.type === "solicitud_ingreso") return "Ver solicitud →";
  return "Ver grupo →";
}

export function NotificationItem({ notificacion: n }: Props) {
  const navigate = useNavigate();
  const priority = n.priority ?? "normal";
  const styles = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.normal;
  const route = getActionRoute(n);
  const label = getActionLabel(n);

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
        {n.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5 break-words">
            {n.description}
          </p>
        )}
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          {formatDate(n.createdAt)}
        </p>

        {route && label && (
          <>
            <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-700/50" />
            <button
              onClick={() => navigate(route)}
              className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              {label}
            </button>
          </>
        )}
      </div>

      {!n.read && (
        <span className="shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2" />
      )}
    </div>
  );
}

export default NotificationItem;