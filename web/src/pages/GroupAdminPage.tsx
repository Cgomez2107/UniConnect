import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { useProfileNames } from "@/hooks/useProfileNames";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/RoleBadge";
import studyGroupsService from "@/lib/services/studyGroups.service";
import messagingService from "@/lib/services/messaging.service";
import type { StudyRequest, Member, Application } from "@/types";

type AppTab = "pendientes" | "aceptadas" | "rechazadas";

export function GroupAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [solicitud, setSolicitud] = useState<StudyRequest | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("pendientes");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [data, membersData, appsData] = await Promise.all([
          studyGroupsService.getStudyGroupById(id),
          studyGroupsService.getStudyGroupMembers(id),
          studyGroupsService.getStudyGroupApplications(id),
        ]);
        if (cancelled) return;
        setSolicitud(data);
        setMembers(membersData);
        setApplications(appsData);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Error al cargar datos del grupo.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const applicantIds = useMemo(
    () => applications.filter((a) => !members.some((m) => m.userId === a.applicantId)).map((a) => a.applicantId),
    [applications, members],
  );

  const memberIds = useMemo(
    () => members.filter((m) => !m.fullName).map((m) => m.userId),
    [members],
  );

  const profileNames = useProfileNames([...new Set([...applicantIds, ...memberIds])]);

  const isAuthor = solicitud?.authorId === user?.id;
  const isAdmin = isAuthor || members.some((m) => m.userId === user?.id && (m.role === "admin" || m.role === "autor"));

  const resolveName = useCallback(
    (userId: string, fallback: string | null): string => {
      if (fallback) return fallback;
      return profileNames.get(userId)?.fullName || "Usuario";
    },
    [profileNames],
  );

  const resolveAvatar = useCallback(
    (userId: string): string | null => {
      return profileNames.get(userId)?.avatarUrl || null;
    },
    [profileNames],
  );

  const sortedMembers = useMemo(
    () =>
      [...members]
        .map((m) => ({
          ...m,
          fullName: m.fullName || resolveName(m.userId, null),
          avatarUrl: m.avatarUrl || resolveAvatar(m.userId),
        }))
        .sort((a, b) => {
          const order: Record<string, number> = { autor: 0, admin: 1, miembro: 2 };
          return (order[a.role] ?? 3) - (order[b.role] ?? 3);
        }),
    [members, resolveName, resolveAvatar],
  );

  const filteredApps = useMemo(
    () =>
      applications
        .map((a) => ({
          ...a,
          applicantName: resolveName(a.applicantId, null),
          applicantAvatar: resolveAvatar(a.applicantId),
        }))
        .filter((a) => a.status === activeTab),
    [applications, activeTab, resolveName, resolveAvatar],
  );

  const handleReview = async (applicationId: string, status: "aceptada" | "rechazada") => {
    setReviewingId(applicationId);
    try {
      await studyGroupsService.reviewApplication(applicationId, status);
      const [updatedApps, updatedMembers] = await Promise.all([
        studyGroupsService.getStudyGroupApplications(id!),
        studyGroupsService.getStudyGroupMembers(id!),
      ]);
      setApplications(updatedApps);
      setMembers(updatedMembers);
    } catch (err: any) {
      setError(err?.response?.data?.message || `Error al ${status === "aceptada" ? "aceptar" : "rechazar"} la postulación.`);
    } finally {
      setReviewingId(null);
    }
  };

  const handlePrivateChat = async (targetUserId: string) => {
    try {
      const conversation = await messagingService.createConversation(targetUserId);
      navigate(`/chat/${conversation.id}`);
    } catch (err: any) {
      setError("Error al iniciar chat.");
    }
  };

  const handleRequestTransfer = useCallback(async () => {
    if (!id || !transferTargetId) return;
    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(false);
    try {
      await studyGroupsService.requestAdminTransfer(id, transferTargetId);
      setTransferSuccess(true);
      setTransferTargetId(null);
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferSuccess(false);
      }, 2000);
    } catch (err: any) {
      setTransferError(err?.response?.data?.message || "Error al solicitar la transferencia.");
    } finally {
      setTransferLoading(false);
    }
  }, [id, transferTargetId]);

  const handleLeave = async () => {
    if (!id) return;
    setLeaveLoading(true);
    try {
      await studyGroupsService.leaveStudyGroup(id);
      navigate("/solicitudes");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al salir del grupo.");
    } finally {
      setLeaveLoading(false);
      setShowLeaveConfirm(false);
    }
  };

  const tabCounts = useMemo(() => {
    const counts = { pendientes: 0, aceptadas: 0, rechazadas: 0 };
    applications.forEach((a) => {
      if (a.status in counts) counts[a.status as keyof typeof counts]++;
    });
    return counts;
  }, [applications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !solicitud) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 dark:text-error-400 mb-4">{error}</p>
          <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">Grupo no encontrado</p>
          <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(`/grupo/${id}`)}
          className="text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium mb-4 transition-colors"
        >
          ← Volver al grupo
        </button>

        {/* Group Header */}
        <div className="card bg-primary-900 !border-primary-800 text-white p-6 sm:p-8 mb-6 animate-slide-up">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={solicitud.title || "Grupo"} size="md" className="!bg-secondary-500 !text-primary-900" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{solicitud.title || "Grupo de estudio"}</h1>
              <p className="text-sm text-white/70 mt-1">
                Panel de administración
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {isAuthor && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTransferModal(true)}
              >
                Transferir admin
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowLeaveConfirm(true)}
              loading={leaveLoading}
            >
              Salir del grupo
            </Button>
          </div>
          {error && (
            <p className="text-error-400 text-sm mt-3">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications Panel */}
          <div className="lg:col-span-2 card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-primary-900 dark:text-white">
                Postulaciones
              </h2>
              <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                {(["pendientes", "aceptadas", "rechazadas"] as AppTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-tighter transition-all ${
                      activeTab === tab
                        ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-white shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    }`}
                  >
                    {tab}
                    {tabCounts[tab] > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-[10px]">
                        {tabCounts[tab]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                  {activeTab === "pendientes"
                    ? "No hay postulaciones pendientes."
                    : activeTab === "aceptadas"
                      ? "No hay postulaciones aceptadas."
                      : "No hay postulaciones rechazadas."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={app.applicantName} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-primary-900 dark:text-white">
                          {app.applicantName}
                        </p>
                        {app.message && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                            {app.message}
                          </p>
                        )}
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                          {new Date(app.createdAt).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrivateChat(app.applicantId)}
                        className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                        title="Enviar mensaje"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </button>
                      {app.status === "pendiente" && (
                        <>
                          <button
                            onClick={() => handleReview(app.id, "aceptada")}
                            disabled={reviewingId === app.id}
                            className="p-2 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50 transition-colors disabled:opacity-50"
                            title="Aceptar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReview(app.id, "rechazada")}
                            disabled={reviewingId === app.id}
                            className="p-2 rounded-lg bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400 hover:bg-error-200 dark:hover:bg-error-900/50 transition-colors disabled:opacity-50"
                            title="Rechazar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members Panel */}
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary-900 dark:text-white">
                Miembros
              </h2>
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {members.length}
              </span>
            </div>

            {sortedMembers.length === 0 ? (
              <p className="text-neutral-400 dark:text-neutral-500 text-sm text-center py-8">
                Sin miembros
              </p>
            ) : (
              <div className="space-y-2">
                {sortedMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-700/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={member.fullName || "Usuario"} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary-900 dark:text-white truncate">
                          {member.fullName || "Usuario"}
                          {member.userId === user?.id && (
                            <span className="text-neutral-400 dark:text-neutral-500 font-normal"> (tú)</span>
                          )}
                        </p>
                        <RoleBadge role={member.role} />
                      </div>
                    </div>
                    <button
                      onClick={() => handlePrivateChat(member.userId)}
                      className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors shrink-0"
                      title="Enviar mensaje"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="Salir del grupo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLeaveConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleLeave} loading={leaveLoading}>
              Salir
            </Button>
          </>
        }
      >
        <p className="text-neutral-600 dark:text-neutral-300">
          ¿Estás seguro de que deseas salir de este grupo de estudio?
        </p>
      </Modal>

      <Modal
        isOpen={showTransferModal}
        onClose={() => { setShowTransferModal(false); setTransferError(null); setTransferSuccess(false); setTransferTargetId(null); }}
        title="Transferir administración"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowTransferModal(false); setTransferError(null); setTransferTargetId(null); }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleRequestTransfer}
              loading={transferLoading}
              disabled={!transferTargetId || transferSuccess}
            >
              {transferSuccess ? "Transferida" : "Transferir"}
            </Button>
          </>
        }
      >
        {transferSuccess ? (
          <p className="text-success-600 dark:text-success-400">
            Solicitud de transferencia enviada.
          </p>
        ) : (
          <>
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              Selecciona el miembro al que deseas transferir la administración.
            </p>
            {transferError && (
              <p className="text-error-600 dark:text-error-400 text-sm mb-3">{transferError}</p>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sortedMembers
                .filter((m) => m.role !== "autor" && m.userId !== user?.id)
                .map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => setTransferTargetId(member.userId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      transferTargetId === member.userId
                        ? "bg-primary-50 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700"
                        : "bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <Avatar name={member.fullName || "Usuario"} size="sm" />
                    <span className="font-medium text-primary-900 dark:text-white text-sm">
                      {member.fullName || "Usuario"}
                    </span>
                  </button>
                ))}
              {sortedMembers.filter((m) => m.role !== "autor" && m.userId !== user?.id).length === 0 && (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm text-center py-4">
                  No hay otros miembros para transferir.
                </p>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default GroupAdminPage;
