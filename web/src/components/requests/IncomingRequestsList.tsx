import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import studyGroupsService from "@/lib/services/studyGroups.service";
import { useProfileNames } from "@/hooks/useProfileNames";
import type { ApplicationStatus } from "@/types";

interface ApplicantDisplay {
  id: string;
  applicantId: string;
  userName: string;
  userAvatar: string | null;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
}

interface GroupWithApps {
  id: string;
  title: string;
  status: string;
  applications: ApplicantDisplay[];
  counts: Record<ApplicationStatus, number>;
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

export function IncomingRequestsList() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupWithApps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const myGroups = await studyGroupsService.listMyStudyRequests();
      const groupsWithApps = await Promise.all(
        (myGroups || []).map(async (g: any) => {
          try {
            const apps = await studyGroupsService.getStudyGroupApplications(g.id);
            const counts: Record<ApplicationStatus, number> = { pendiente: 0, aceptada: 0, rechazada: 0 };
            const mappedApps: ApplicantDisplay[] = (apps || []).map((a: any) => {
              const userId = a.applicantId || a.userId || a.user?.id;
              counts[a.status as ApplicationStatus]++;
              return {
                id: a.id,
                applicantId: userId,
                userName: "",
                userAvatar: null,
                message: a.message || "",
                status: a.status,
                createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : (a.createdAt || ""),
              };
            });
            return { id: g.id, title: g.title || "Sin nombre", status: g.status || "abierta", applications: mappedApps, counts };
          } catch {
            return { id: g.id, title: g.title || "Sin nombre", status: g.status || "abierta", applications: [], counts: { pendiente: 0, aceptada: 0, rechazada: 0 } };
          }
        })
      );
      setGroups(groupsWithApps);
    } catch (err: any) {
      setError(err?.message || "Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const applicantIds = groups.flatMap((g) => g.applications.map((a) => a.applicantId));
  const profileNames = useProfileNames(applicantIds);

  const groupsWithNames = groups.map((g) => ({
    ...g,
    applications: g.applications.map((a) => ({
      ...a,
      userName: profileNames.get(a.applicantId)?.fullName || "Usuario",
      userAvatar: profileNames.get(a.applicantId)?.avatarUrl || null,
    })),
  }));

  const handleReview = async (applicationId: string, status: "aceptada" | "rechazada") => {
    setReviewingId(applicationId);
    try {
      await studyGroupsService.reviewApplication(applicationId, status);
      await loadData();
    } catch (err: any) {
      setError(err?.message || `Error al ${status === "aceptada" ? "aceptar" : "rechazar"} la postulación`);
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) return <div className="text-center py-12 text-neutral-500">Cargando solicitudes...</div>;
  if (error) return <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">{error}</div>;
  if (groupsWithNames.length === 0) return (
    <div className="text-center py-12 text-neutral-500">
      <p>No tienes grupos creados</p>
      <p className="text-sm mt-1">Crea un grupo para gestionar solicitudes aquí</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {groupsWithNames.map((group) => (
        <div key={group.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-primary-900 text-lg">{group.title}</h3>
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 capitalize">{group.status}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700">{group.counts.pendiente} pendientes</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">{group.counts.aceptada} aceptadas</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-700">{group.counts.rechazada} rechazadas</span>
            </div>
          </div>

          {group.applications.length === 0 ? (
            <div className="p-4 text-sm text-neutral-400 text-center">Sin solicitudes</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {group.applications.map((app) => (
                <div key={app.id} className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">
                    {app.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-neutral-900">{app.userName}</span>
                      <span className="text-xs text-neutral-400">{timeAgo(app.createdAt)}</span>
                    </div>
                    {app.message && <p className="text-xs text-neutral-600 mt-0.5 truncate">{app.message}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {app.status === "pendiente" ? (
                      <>
                        <button
                          onClick={() => handleReview(app.id, "aceptada")}
                          disabled={reviewingId === app.id}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleReview(app.id, "rechazada")}
                          disabled={reviewingId === app.id}
                          className="px-3 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          Rechazar
                        </button>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${app.status === "aceptada" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {app.status === "aceptada" ? "Aceptada" : "Rechazada"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-neutral-50 border-t border-neutral-100">
            <button
              onClick={() => navigate(`/grupo/${group.id}`)}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Ver grupo →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
