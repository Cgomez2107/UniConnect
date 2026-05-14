import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { useProfileNames } from "@/hooks/useProfileNames";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { MemberListItem } from "@/components/ui/MemberListItem";
import studyGroupsService from "@/lib/services/studyGroups.service";
import type { Application, Member } from "@/types";

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "Fecha no disponible";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Fecha no disponible";
    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Fecha no disponible";
  }
}

export function SolicitudDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [solicitud, setSolicitud] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [myAppStatus, setMyAppStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        const data: any = await studyGroupsService.getStudyGroupById(id);
        if (cancelled) return;
        setSolicitud(data);

        if (user?.id) {
          const myApps: Application[] = await studyGroupsService.listMyApplications();
          if (cancelled) return;
          const myApp = myApps.find((a: Application) => a.requestId === id);
          if (myApp) setMyAppStatus(myApp.status);

          if (user.id === data.authorId) {
            const apps = await studyGroupsService.getStudyGroupApplications(id);
            if (!cancelled) setApplications(apps);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          if (err.response?.status === 404) {
            setSolicitud(null);
          } else {
            setFetchError("Error al cargar los datos del grupo. Intenta de nuevo.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [id, user?.id]);

  const refreshApplications = useCallback(async () => {
    if (!id) return;
    try {
      const apps = await studyGroupsService.getStudyGroupApplications(id);
      setApplications(apps);
    } catch {
    }
  }, [id]);

  const handleReview = useCallback(async (applicationId: string, decision: "aceptada" | "rechazada") => {
    setActionLoading(applicationId);
    setError(null);
    try {
      await studyGroupsService.reviewApplication(applicationId, decision);
      await refreshApplications();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al procesar la postulación.");
    } finally {
      setActionLoading(null);
    }
  }, [refreshApplications]);

  const handleCancelRequest = async () => {
    if (!id) return;
    setActionLoading("cancel");
    setError(null);
    try {
      await studyGroupsService.cancelStudyRequest(id);
      const data = await studyGroupsService.getStudyGroupById(id);
      setSolicitud(data);
      setShowCancelConfirm(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al cancelar la solicitud.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    setActionLoading("leave");
    setError(null);
    try {
      await studyGroupsService.cancelMyApplication(id);
      navigate("/solicitudes");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al salir del grupo.");
    } finally {
      setActionLoading(null);
    }
  };

  const allUserIds = useMemo(() => {
    const ids: string[] = [];
    if (solicitud?.authorId) ids.push(solicitud.authorId);
    for (const app of applications) {
      if (app.applicantId) ids.push(app.applicantId);
    }
    return ids;
  }, [solicitud?.authorId, applications]);

  const profileNames = useProfileNames(allUserIds);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 dark:text-error-400 mb-4">{fetchError}</p>
          <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">Solicitud no encontrada</p>
          <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
        </div>
      </div>
    );
  }

  const getDisplayName = (userId: string, fallback: string): string => {
    if (fallback !== "Usuario") return fallback;
    const data = profileNames.get(userId);
    return data?.fullName || fallback;
  };

  const getAvatarUrl = (userId: string): string | null => {
    const data = profileNames.get(userId);
    return data?.avatarUrl || null;
  };

  const title = solicitud.title || "Grupo de estudio";
  const creatorName = getDisplayName(solicitud.authorId, solicitud.author?.fullName || "Usuario");
  const subjectName = solicitud.subjectName || "";
  const description = solicitud.description || "";
  const isOpen = solicitud.status === "abierta";
  const isAuthor = user?.id === solicitud.authorId;
  const isMember = myAppStatus === "aceptada";
  const hasApplied = myAppStatus !== null;
  const pendingApps = applications.filter((a: any) => a.status === "pendiente");
  const acceptedApps = applications.filter((a: any) => a.status === "aceptada");

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/solicitudes")}
          className="text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium mb-4 transition-colors"
        >
          ← Volver a solicitudes
        </button>

        <div className="card bg-primary-900 !border-primary-800 text-white p-6 sm:p-8 mb-6 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={creatorName} size="md" className="!bg-secondary-500 !text-primary-900" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{title}</h1>
              <p className="text-sm text-white/70 mt-1">por {creatorName}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {subjectName && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                {subjectName}
              </span>
            )}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              isOpen ? "bg-secondary-500/25 text-secondary-200" : "bg-white/20 text-white/70"
            }`}>
              {isOpen ? "Abierta" : (solicitud.status || "Cerrada")}
            </span>
          </div>

          {description && (
            <p className="text-sm sm:text-base leading-relaxed text-white/80 mb-6">
              {description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 p-4 bg-primary-800 rounded-lg mb-6">
            <div>
              <p className="text-xs text-white/60">Postulaciones</p>
              <p className="font-bold text-lg mt-0.5">{solicitud.applicationsCount ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Creado</p>
              <p className="font-bold text-lg mt-0.5">{formatDate(solicitud.createdAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {isOpen && (!hasApplied || myAppStatus === "rechazada") && !isAuthor && (
              <Button onClick={() => navigate(`/postular/${id}`)} variant="primary">
                Postularme
              </Button>
            )}

            {hasApplied && myAppStatus !== "rechazada" && !isAuthor && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isMember ? "bg-success-500/20 text-success-300" : "bg-warning-500/20 text-warning-300"
                }`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {isMember ? "Eres miembro del grupo" : "Postulación en revisión"}
                </span>
                {isMember && (
                  <Button variant="primary" size="sm" onClick={() => navigate(`/grupo/${id}`)}>
                    Ver grupo
                  </Button>
                )}
                {(isMember || myAppStatus === "pendiente") && (
                  <Button variant="danger" size="sm" onClick={handleLeave} loading={actionLoading === "leave"}>
                    {isMember ? "Salir del grupo" : "Cancelar postulación"}
                  </Button>
                )}
              </div>
            )}

            {hasApplied && myAppStatus === "rechazada" && !isAuthor && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-error-500/20 text-error-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  Postulación rechazada
                </span>
              </div>
            )}

            {isAuthor && (
              <Button variant="primary" size="sm" onClick={() => navigate(`/grupo/${id}`)}>
                Ver grupo
              </Button>
            )}
            {isAuthor && isOpen && (
              <Button variant="danger" size="sm" onClick={() => setShowCancelConfirm(true)}>
                Cancelar solicitud
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 text-error-700 dark:text-error-300 text-sm mb-6">
            {error}
          </div>
        )}

        {isAuthor && (
          <div className="card p-6 animate-slide-up mb-6">
            <h2 className="text-lg font-bold text-primary-900 dark:text-white mb-4">
              Postulaciones ({applications.length})
              {pendingApps.length > 0 && (
                <span className="ml-2 text-sm font-normal text-neutral-500">
                  ({pendingApps.length} pendientes)
                </span>
              )}
            </h2>

            {applications.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">Sin postulaciones aún</p>
            ) : (
              <div className="space-y-4">
                {applications.map((app: any) => (
                  <div key={app.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar
                        name={getDisplayName(app.applicantId, "Usuario")}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-primary-900 dark:text-white text-sm">
                          {getDisplayName(app.applicantId, "Usuario")}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatDate(app.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        app.status === "pendiente" ? "bg-warning-50 text-warning-800 border-warning-200 dark:bg-warning-900/30 dark:text-warning-300 dark:border-warning-800" :
                        app.status === "aceptada" ? "bg-success-50 text-success-800 border-success-200 dark:bg-success-900/30 dark:text-success-300 dark:border-success-800" :
                        "bg-error-50 text-error-800 border-error-200 dark:bg-error-900/30 dark:text-error-300 dark:border-error-800"
                      }`}>
                        {app.status === "pendiente" ? "Pendiente" :
                         app.status === "aceptada" ? "Aceptada" : "Rechazada"}
                      </span>
                    </div>

                    {app.message && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 ml-11">{app.message}</p>
                    )}

                    {app.status === "pendiente" && (
                      <div className="flex gap-2 mt-3 ml-11">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReview(app.id, "aceptada")}
                          loading={actionLoading === app.id}
                          disabled={actionLoading === app.id}
                        >
                          Aceptar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReview(app.id, "rechazada")}
                          loading={actionLoading === app.id}
                          disabled={actionLoading === app.id}
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {acceptedApps.length > 0 && (
          <div className="card p-6 animate-slide-up mb-6">
            <h2 className="text-lg font-bold text-primary-900 dark:text-white mb-4">
              Miembros ({acceptedApps.length + 1})
            </h2>
            <div className="space-y-2">
              <MemberListItem
                member={{
                  userId: solicitud.authorId,
                  fullName: creatorName,
                  avatarUrl: solicitud.author?.avatarUrl || null,
                  role: "autor",
                  joinedAt: solicitud.createdAt,
                }}
                isCurrentUser={user?.id === solicitud.authorId}
              />
              {acceptedApps.map((app: any) => (
                <MemberListItem
                  key={app.id}
                  member={{
                    userId: app.applicantId,
                    fullName: getDisplayName(app.applicantId, "Usuario"),
                    avatarUrl: getAvatarUrl(app.applicantId),
                    role: "miembro",
                    joinedAt: app.createdAt,
                  }}
                  isCurrentUser={user?.id === app.applicantId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancelar solicitud"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>
              Volver
            </Button>
            <Button variant="danger" onClick={handleCancelRequest} loading={actionLoading === "cancel"}>
              Cancelar solicitud
            </Button>
          </>
        }
      >
        <p className="text-neutral-600 dark:text-neutral-300">
          ¿Estás seguro de que deseas cancelar esta solicitud? Los miembros serán notificados.
        </p>
      </Modal>
    </div>
  );
}

export default SolicitudDetailPage;
