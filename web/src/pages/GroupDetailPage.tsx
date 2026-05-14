import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
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

const roleLabels: Record<string, string> = {
  autor: "Creador",
  admin: "Admin",
  miembro: "Miembro",
};

const roleBadgeColors: Record<string, string> = {
  autor: "bg-secondary-500/20 text-secondary-300",
  admin: "bg-blue-500/20 text-blue-300",
  miembro: "bg-neutral-500/20 text-neutral-300",
};

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [solicitud, setSolicitud] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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
  const creatorName = solicitud.author?.fullName || "Usuario";
  const subjectName = solicitud.subjectName || "";
  const description = solicitud.description || "";

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAuthor = currentMember?.role === "autor";

  const sortedMembers = [...members].sort((a, b) => {
    const order: Record<string, number> = { autor: 0, admin: 1, miembro: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });

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
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary-500/25 text-secondary-200">
              {solicitud.status === "abierta" ? "Abierta" : solicitud.status || "Cerrada"}
            </span>
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
              variant="danger"
              size="sm"
              onClick={() => setShowLeaveConfirm(true)}
              loading={leaveLoading}
            >
              Salir del grupo
            </Button>
          </div>
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
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg"
                >
                  <Avatar name={member.fullName || "Usuario"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary-900 dark:text-white text-sm truncate">
                      {member.fullName || "Usuario"}
                      {member.userId === user?.id && (
                        <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">
                          (tú)
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                      roleBadgeColors[member.role] || "bg-neutral-500/20 text-neutral-300"
                    }`}
                  >
                    {roleLabels[member.role] || member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
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
              Salir del grupo
            </Button>
          </>
        }
      >
        <p className="text-neutral-600 dark:text-neutral-300">
          ¿Estás seguro de que deseas salir de este grupo de estudio?
        </p>
      </Modal>
    </div>
  );
}

export default GroupDetailPage;
