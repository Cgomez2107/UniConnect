import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, X, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import type { Prioridad, Accion } from "@/types";
import { GATEWAY_BASE_URL, API_PREFIX } from "@/lib/api/client";

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

const PRIORITY_STYLES: Record<Prioridad, { border: string; icon: string; bg: string }> = {
  normal: { border: "border-l-primary-500", icon: "bg-primary-100 text-primary-600", bg: "" },
  urgente: { border: "border-l-amber-500", icon: "bg-amber-100 text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10" },
  critica: { border: "border-l-error-500", icon: "bg-error-100 text-error-600", bg: "bg-error-50 dark:bg-error-900/10" },
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

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? parsed?.token ?? null;
  } catch {
    return null;
  }
}

export function NotificationItem({ notificacion: n }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const priority = n.priority ?? "normal";
  const styles = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.normal;

  const handleAction = async (endpoint: string) => {
    if (!endpoint || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const token = getToken();
      const res = await fetch(`${GATEWAY_BASE_URL}${API_PREFIX}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Error ${res.status}`);
      }
      setResult({ ok: true, message: "Hecho" });
      setTimeout(() => setResult(null), 2000);
    } catch (err: any) {
      setResult({ ok: false, message: err.message ?? "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  const showActions = !!(n.action || (isTransfer(n.type) && (n.data?.groupId ?? n.data?.requestId)) || (!isTransfer(n.type) && !isRejected(n.type) && !isAccepted(n.type) && n.data?.requestId));

  return (
    <div
      className={`card p-4 flex items-start gap-3 border-l-4 ${styles.border} ${!n.read ? styles.bg : ""}`}
    >
      {/* Icono — decorador visual */}
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

      {/* CORE: inmutable — siempre igual sin importar decoradores */}
      <div className="flex-1 min-w-0 overflow-hidden break-words">
        <p className="font-semibold text-sm text-neutral-900 dark:text-white">
          {n.title}
        </p>
        {n.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5 break-words">
            {n.description}
          </p>
        )}
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          {formatDate(n.createdAt)}
        </p>

        {/* Decoradores: botones de acción (solo si existen) */}
        {showActions && (
          <>
            <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-700/50" />
            <div className="flex flex-wrap gap-2 items-center">
              {n.action && (
                <button
                  onClick={() => handleAction(n.action!.endpoint)}
                  disabled={loading}
                  className={`text-xs font-medium px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${
                    loading
                      ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed"
                      : result?.ok
                      ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300"
                      : "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/30"
                  }`}
                >
                  {loading ? (
                    <><Loader2 size={12} className="animate-spin" /> Enviando...</>
                  ) : result?.ok ? (
                    <><Check size={12} /> {result.message}</>
                  ) : (
                    n.action.label
                  )}
                </button>
              )}
              {result && !result.ok && (
                <span className="text-xs text-error-600 dark:text-error-400">{result.message}</span>
              )}
              {isTransfer(n.type) && !n.action && (n.data?.groupId ?? n.data?.requestId) && (
                <button
                  onClick={() => navigate(`/grupo/${n.data?.groupId ?? n.data?.requestId}?acceptTransfer=${n.data?.transferId}`)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver grupo →
                </button>
              )}
              {!isTransfer(n.type) && !isRejected(n.type) && !isAccepted(n.type) && !n.action && n.data?.groupId && !n.data?.requestId && (
                <button
                  onClick={() => navigate(`/grupo/${n.data?.groupId}`)}
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
