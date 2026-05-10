import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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

function getInitials(name: string): string {
  return (name.charAt(0) || "?").toUpperCase();
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

  const UC_BLUE = "#0d2852";
  const UC_GOLD = "#d4a843";
  const UC_BLUE_LIGHT = "#1a3a6b";

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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#dc2626", marginBottom: "1rem" }}>{fetchError}</p>
        <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Solicitud no encontrada</p>
        <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
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
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2rem 1rem" }}>
        <button
          onClick={() => navigate("/solicitudes")}
          style={{ color: UC_BLUE, textDecoration: "underline", marginBottom: "1rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem" }}
        >
          ← Volver a solicitudes
        </button>

        <div style={{
          backgroundColor: UC_BLUE,
          borderRadius: "12px",
          padding: "2rem",
          marginBottom: "1.5rem",
          color: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: UC_GOLD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1.25rem",
              color: UC_BLUE,
              flexShrink: 0,
            }}>
              {getInitials(creatorName)}
            </div>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                {title}
              </h1>
              <p style={{ fontSize: "0.875rem", opacity: 0.8, marginTop: "0.25rem" }}>
                por {creatorName}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {subjectName && (
              <span style={{
                display: "inline-block",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "#fff",
              }}>
                {subjectName}
              </span>
            )}
            {facultyName && (
              <span style={{
                display: "inline-block",
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: UC_GOLD,
                color: UC_BLUE,
              }}>
                {facultyName}
              </span>
            )}
            <span style={{
              display: "inline-block",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              backgroundColor: isOpen ? "rgba(212,168,67,0.3)" : "rgba(255,255,255,0.15)",
              color: isOpen ? UC_GOLD : "#d1d5db",
            }}>
              {isOpen ? "Abierta" : groupStatus}
            </span>
          </div>

          {description && (
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, opacity: 0.9, marginBottom: "1.5rem" }}>
              {description}
            </p>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "1rem",
            padding: "1rem",
            backgroundColor: UC_BLUE_LIGHT,
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}>
            <div>
              <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: 0 }}>Postulaciones</p>
              <p style={{ fontWeight: 700, fontSize: "1.125rem", margin: "0.125rem 0 0 0" }}>{memberCount}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", opacity: 0.7, margin: 0 }}>Creado</p>
              <p style={{ fontWeight: 700, fontSize: "1.125rem", margin: "0.125rem 0 0 0" }}>{formatDate(createdAt)}</p>
            </div>
          </div>

          {isOpen && !hasApplied && (
            <Button
              onClick={() => setShowApplicationModal(true)}
              variant="primary"
            >
              Postularme
            </Button>
          )}

          {hasApplied && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: "8px",
              fontSize: "0.9375rem",
              fontWeight: 500,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={UC_GOLD} strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Tu postulación está en revisión
            </div>
          )}
        </div>

        {user?.id === authorId && (
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: UC_BLUE, marginBottom: "1rem" }}>
              Postulaciones ({applications.length})
            </h2>
            {applications.length === 0 ? (
              <p style={{ color: "#6b7280" }}>Sin postulaciones aún</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {applications.map((app: any) => (
                  <div key={app.id} style={{ borderLeft: `4px solid ${UC_GOLD}`, padding: "0.75rem" }}>
                    <p style={{ fontWeight: 600, color: UC_BLUE }}>
                      {app.profiles?.full_name || app.applicantName || "Usuario"}
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{app.message}</p>
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
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {submitError && (
              <div style={{ padding: "0.75rem", backgroundColor: "#fef2f2", color: "#dc2626", borderRadius: "8px", fontSize: "0.875rem" }}>
                {submitError}
              </div>
            )}
            <textarea
              placeholder="Cuéntanos por qué quieres unirte a este grupo..."
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "0.875rem",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.target.style.borderColor = UC_GOLD; }}
              onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; }}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <Button
                variant="secondary"
                onClick={() => { setShowApplicationModal(false); setApplicationMessage(""); setSubmitError(null); }}
              >
                Cancelar
              </Button>
              <button
                onClick={handleApply}
                disabled={submitting || !applicationMessage.trim()}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: submitting || !applicationMessage.trim() ? "#93c5fd" : UC_BLUE,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: submitting || !applicationMessage.trim() ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Enviando..." : "Enviar postulación"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default SolicitudDetailPage;
