import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import studyGroupsService from "@/lib/services/studyGroups.service";

type StatusFilter = "todas" | "pendiente" | "aceptada" | "rechazada";

interface EnhancedApp {
  id: string;
  groupId: string;
  groupName: string;
  message: string;
  status: "pendiente" | "aceptada" | "rechazada";
  createdAt: string;
  reviewedAt: string | null;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-ES");
}

export function MyApplicationsList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [apps, setApps] = useState<EnhancedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await studyGroupsService.listMyApplications();
      const requestIds = [...new Set((raw || []).map((a: any) => a.requestId || a.groupId))];
      const groupNames = new Map<string, string>();
      await Promise.all(
        requestIds.map(async (rid: string) => {
          try {
            const g: any = await studyGroupsService.getStudyGroupById(rid);
            groupNames.set(rid, g.title || g.name || "Sin nombre");
          } catch {
            groupNames.set(rid, "Grupo");
          }
        })
      );
      setApps((raw || []).map((a: any) => {
        const gid = a.requestId || a.groupId;
        return {
          id: a.id,
          groupId: gid,
          groupName: groupNames.get(gid) || "Grupo",
          message: a.message || "",
          status: a.status,
          createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : (a.createdAt || ""),
          reviewedAt: a.reviewedAt instanceof Date ? a.reviewedAt.toISOString() : (a.reviewedAt || null),
        };
      }));
    } catch (err: any) {
      setError(err?.message || "Error al cargar postulaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = statusFilter === "todas" ? apps : apps.filter((a) => a.status === statusFilter);
  const counts = {
    pendiente: apps.filter((a) => a.status === "pendiente").length,
    aceptada: apps.filter((a) => a.status === "aceptada").length,
    rechazada: apps.filter((a) => a.status === "rechazada").length,
  };

  if (loading) return <div className="text-center py-12 text-neutral-500">Cargando postulaciones...</div>;
  if (error) return <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">{error}</div>;

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["todas", "pendiente", "aceptada", "rechazada"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              statusFilter === f
                ? "bg-primary-50 text-primary-700 border-primary-200"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {f === "todas" ? `Todas (${apps.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p>{statusFilter === "todas" ? "No te has postulado a ningún grupo" : `No hay postulaciones ${statusFilter}`}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div key={app.id} className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
                {app.groupName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-neutral-900">{app.groupName}</span>
                  <span className="text-xs text-neutral-400">{timeAgo(app.createdAt)}</span>
                </div>
                {app.message && <p className="text-xs text-neutral-600 mt-0.5 truncate">{app.message}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  app.status === "pendiente" ? "bg-amber-50 text-amber-700" :
                  app.status === "aceptada" ? "bg-green-50 text-green-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  {app.status === "pendiente" ? "Pendiente" : app.status === "aceptada" ? "Aceptada" : "Rechazada"}
                </span>
                <button
                  onClick={() => navigate(`/solicitud/${app.groupId}`)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  Ver solicitud
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
