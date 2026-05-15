import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { useProfileNames } from "@/hooks/useProfileNames";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { MemberListItem } from "@/components/ui/MemberListItem";
import { GroupStatusBadge } from "@/components/GroupStatusBadge";
import studyGroupsService from "@/lib/services/studyGroups.service";
import type { Member } from "@/types";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [solicitud, setSolicitud] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [acceptTransferLoading, setAcceptTransferLoading] = useState(false);
  const [acceptTransferError, setAcceptTransferError] = useState<string | null>(null);
  const [acceptTransferSuccess, setAcceptTransferSuccess] = useState(false);

  const pendingTransferId = searchParams.get("acceptTransfer");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [data, membersData] = await Promise.all([
          studyGroupsService.getStudyGroupById(id),
          studyGroupsService.getStudyGroupMembers(id),
        ]);

        if (cancelled) return;
        setSolicitud(data);
        setMembers(membersData);
      } catch (err: any) {
        if (!cancelled) {
          if (err.response?.status === 404 || err.response?.status === 403) {
            setSolicitud(null);
          } else {
            setError("Error al cargar los datos del grupo.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [id]);

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

  const handleAcceptTransfer = useCallback(async () => {
    if (!pendingTransferId) return;
    setAcceptTransferLoading(true);
    setAcceptTransferError(null);
    setAcceptTransferSuccess(false);
    try {
      await studyGroupsService.acceptAdminTransfer(pendingTransferId);
      setAcceptTransferSuccess(true);
      // Refresh to get updated roles
      const [data, membersData] = await Promise.all([
        studyGroupsService.getStudyGroupById(id!),
        studyGroupsService.getStudyGroupMembers(id!),
      ]);
      setSolicitud(data);
      setMembers(membersData);
      // Clean URL
      navigate(`/grupo/${id}`, { replace: true });
    } catch (err: any) {
      setAcceptTransferError(err?.response?.data?.message || "Error al aceptar la transferencia.");
    } finally {
      setAcceptTransferLoading(false);
    }
  }, [pendingTransferId, id, navigate]);

  const memberIds = useMemo(
    () => members.filter((m) => !m.fullName).map((m) => m.userId),
    [members],
  );

  const profileNames = useProfileNames(memberIds);

  const resolveName = (userId: string, fallback: string | null): string => {
    if (fallback) return fallback;
    const data = profileNames.get(userId);
    return data?.fullName || "Usuario";
  };

  const resolveAvatar = (userId: string): string | null => {
    const data = profileNames.get(userId);
    return data?.avatarUrl || null;
  };

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
    [members, profileNames],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando grupo...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  const title = solicitud.title || "Grupo de estudio";
  const creatorName = resolveName(solicitud.authorId, solicitud.author?.fullName) || "Usuario";
  const subjectName = solicitud.subjectName || "";
  const description = solicitud.description || "";

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAuthor = currentMember?.role === "autor";

  const groupStatus: "abierta" | "llena" | "transferenciaPendiente" | "cerrada" | "expirada" =
    solicitud.hasPendingTransfer
      ? "transferenciaPendiente"
      : solicitud.status === "cerrada"
        ? "cerrada"
        : solicitud.status === "expirada"
          ? "expirada"
          : members.length >= (solicitud.maxMembers || 0)
            ? "llena"
            : "abierta";

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
            <Avatar name={title} size="md" className="!bg-secondary-500 !text-primary-900" />
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
            <GroupStatusBadge status={groupStatus} size="small" />
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
              {members.length} miembro{members.length !== 1 ? "s" : ""}
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
              <p className="font-bold text-lg mt-0.5">
                {formatDate(solicitud.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/grupo/${id}/chat`)}
            >
              Chat del grupo
            </Button>
            {(currentMember?.role === "autor" || currentMember?.role === "admin") && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/grupo/${id}/admin`)}
                >
                  Panel de administración
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowTransferModal(true)}
                >
                  Transferir admin
                </Button>
              </>
            )}
            {pendingTransferId && currentMember && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptTransfer}
                loading={acceptTransferLoading}
              >
                Aceptar transferencia
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
          {acceptTransferError && (
            <p className="text-error-400 text-sm mt-2">{acceptTransferError}</p>
          )}
          {acceptTransferSuccess && (
            <p className="text-success-400 text-sm mt-2">Transferencia aceptada correctamente.</p>
          )}
        </div>

        <div className="card p-6 animate-slide-up">
          <h2 className="text-lg font-bold text-primary-900 dark:text-white mb-4">
            Miembros ({members.length})
          </h2>

          {sortedMembers.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">Sin miembros</p>
          ) : (
            <div className="space-y-2">
              {sortedMembers.map((member) => (
                <MemberListItem
                  key={member.userId}
                  member={member}
                  isCurrentUser={member.userId === user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title={currentMember?.role === "autor" ? "Transferir administración" : "Salir del grupo"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLeaveConfirm(false)}>
              Cancelar
            </Button>
            {currentMember?.role === "autor" ? (
              <Button
                variant="primary"
                onClick={() => { setShowLeaveConfirm(false); setShowTransferModal(true); }}
              >
                Transferir admin
              </Button>
            ) : (
              <Button variant="danger" onClick={handleLeave} loading={leaveLoading}>
                Salir del grupo
              </Button>
            )}
          </>
        }
      >
        {currentMember?.role === "autor" ? (
          <div>
            <p className="text-neutral-600 dark:text-neutral-300 mb-3">
              Como creador del grupo, no puedes salir sin antes transferir la administración a otro miembro.
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Usa "Transferir admin" para seleccionar quién tomará el control del grupo. Una vez aceptada la transferencia, podrás salir.
            </p>
          </div>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-300">
            ¿Estás seguro de que deseas salir de este grupo de estudio?
          </p>
        )}
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
            Solicitud de transferencia enviada. El usuario seleccionado recibirá una notificación.
          </p>
        ) : (
          <>
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              Selecciona el miembro al que deseas transferir la administración del grupo.
            </p>
            {transferError && (
              <p className="text-error-600 dark:text-error-400 text-sm mb-3">{transferError}</p>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {members
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
              {members.filter((m) => m.role !== "autor" && m.userId !== user?.id).length === 0 && (
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

export default GroupDetailPage;
