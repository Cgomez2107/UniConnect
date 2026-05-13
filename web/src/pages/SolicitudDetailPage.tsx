import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import studyGroupsService from "@/lib/services/studyGroups.service";

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
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchSolicitud = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await studyGroupsService.getStudyGroupById(id);
        if (!cancelled) setSolicitud(data);
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
    fetchSolicitud();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id || !user?.id || !solicitud?.author_id) return;
    if (user.id !== solicitud.author_id) return;
    let cancelled = false;
    const fetchApplications = async () => {
      try {
        const apps = await studyGroupsService.getStudyGroupApplications(id);
        if (!cancelled) {
          setApplications(apps);
          const userApp = apps.find((a: any) => a.applicant_id === user.id);
          if (userApp) setHasApplied(true);
        }
      } catch {
        // 403 o cualquier error: lista vacía
      }
    };
    fetchApplications();
    return () => { cancelled = true; };
  }, [id, user?.id, solicitud?.author_id]);

  const handleApply = async () => {
    if (!id || !applicationMessage.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await studyGroupsService.applyToStudyGroup(id, applicationMessage);
      setHasApplied(true);
      setShowApplicationModal(false);
      setApplicationMessage("");
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || "Error al enviar la postulación. Intenta de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 text-sm">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">{fetchError}</p>
          <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Solicitud no encontrada</p>
          <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
        </div>
      </div>
    );
  }

  const title = solicitud.title || solicitud.subjects?.name || solicitud.subject_name || "Grupo de estudio";
  const creatorName = solicitud.profiles?.full_name || "Usuario";
  const memberCount = solicitud.applications_count || 0;
  const groupStatus = solicitud.status;
  const createdAt = solicitud.created_at;
  const authorId = solicitud.author_id;
  const subjectName = solicitud.subjects?.name || solicitud.subject_name || "";
  const facultyName = solicitud.faculty_name || solicitud.subjects?.program_subjects?.[0]?.programs?.faculties?.name || "";
  const description = solicitud.description || "";
  const isOpen = groupStatus === "abierta" || groupStatus === "OPEN";

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/solicitudes")}
          className="text-primary-700 hover:text-primary-800 text-sm font-medium mb-4 transition-colors"
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
            {facultyName && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary-500 text-primary-900">
                {facultyName}
              </span>
            )}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              isOpen ? "bg-secondary-500/20 text-secondary-300" : "bg-white/10 text-white/60"
            }`}>
              {isOpen ? "Abierta" : groupStatus}
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
              <p className="font-bold text-lg mt-0.5">{memberCount}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Creado</p>
              <p className="font-bold text-lg mt-0.5">{formatDate(createdAt)}</p>
            </div>
          </div>

          {isOpen && !hasApplied && (
            <Button onClick={() => setShowApplicationModal(true)} variant="primary">
              Postularme
            </Button>
          )}

          {hasApplied && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-lg text-sm font-medium">
              <svg className="w-4 h-4 text-secondary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Tu postulación está en revisión
            </div>
          )}
        </div>

        {user?.id === authorId && (
          <div className="card p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-primary-900 mb-4">
              Postulaciones ({applications.length})
            </h2>
            {applications.length === 0 ? (
              <p className="text-neutral-500 text-sm">Sin postulaciones aún</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app: any) => (
                  <div key={app.id} className="border-l-4 border-secondary-500 pl-4 py-2">
                    <p className="font-semibold text-primary-900 text-sm">
                      {app.profiles?.full_name || app.applicantName || "Usuario"}
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">{app.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          title="Postularse al grupo de estudio"
        >
          <div className="space-y-4">
            {submitError && (
              <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">
                {submitError}
              </div>
            )}
            <textarea
              placeholder="Cuéntanos por qué quieres unirte a este grupo..."
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 resize-vertical"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => { setShowApplicationModal(false); setApplicationMessage(""); setSubmitError(null); }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApply}
                disabled={submitting || !applicationMessage.trim()}
                loading={submitting}
              >
                {submitting ? "Enviando..." : "Enviar postulación"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default SolicitudDetailPage;
