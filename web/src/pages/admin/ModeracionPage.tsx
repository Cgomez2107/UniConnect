import { useNotificationStore } from "@/store/useNotificationStore";
import { useMemo, useEffect } from "react";
import { ShieldAlert, UserX, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications } from "@/lib/services/notifications.service";

export function ModeracionPage() {
  const notifications = useNotificationStore((s) => s.notifications);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const moderationAlerts = useMemo(() => {
    const seen = new Set<string>();
    return notifications
      .filter((n) => (n.type as string) === "moderation_escalation")
      .filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      });
  }, [notifications]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
            <ShieldAlert className="text-error-500" /> Panel de Moderación
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Revisión humana de casos de spam escalados y múltiples infracciones.
          </p>
        </div>
        <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full font-medium">
          {moderationAlerts.length} casos activos
        </span>
      </div>

      {moderationAlerts.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center text-success-500 mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h3 className="text-lg font-bold text-neutral-800">El sistema está limpio</h3>
          <p className="text-neutral-500 max-w-md mt-2">
            No se han registrado reportes de moderación reincidentes o escalamientos a revisión humana en este momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {moderationAlerts.map((alert) => {
            const data = alert.data ?? (alert as any).payload ?? {};
            const userId = data.userId || "N/A";

            return (
              <div
                key={alert.id}
                className="bg-white rounded-lg border border-neutral-200 border-l-4 border-l-error-500 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-error-50 text-error-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                      Revisión Humana Requerida
                    </span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock size={12} /> {formatDate(alert.createdAt)}
                    </span>
                  </div>

                  <h3 className="font-bold text-neutral-800 text-base">
                    {alert.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    {alert.description || (alert as any).body}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => navigate("/admin/usuarios")}
                    className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 transition-colors px-4 py-2 rounded-lg"
                  >
                    Gestionar Usuario <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
