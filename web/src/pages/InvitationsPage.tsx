import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "@/lib/api/client";
import { GroupStatusBadge, isActionAvailable } from "../components/GroupStatusBadge";
import "./InvitationsPage.css";

interface StudyGroup {
  id: string;
  title: string;
  status: "abierta" | "llena" | "transferenciaPendiente" | "cerrada" | "expirada";
  subject?: { name: string };
  members_count?: number;
  max_members?: number;
}

export const InvitationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"mis-solicitudes" | "mis-postulaciones">(
    "mis-solicitudes"
  );

  useEffect(() => {
    if (!user) return;
    loadGroups();
  }, [activeTab, user]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/study-groups");
      setGroups(response.data?.data || response.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar grupos";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="invitations-page">
        <div className="invitations-header">
          <h1>Mis Solicitudes</h1>
        </div>
        <div className="empty-state">
          <p>Inicia sesión para ver tus solicitudes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invitations-page">
      <div className="invitations-header">
        <h1>Mis Solicitudes</h1>
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === "mis-solicitudes" ? "active" : ""}`}
            onClick={() => setActiveTab("mis-solicitudes")}
          >
            🧩 Mis solicitudes
          </button>
          <button
            className={`tab-btn ${activeTab === "mis-postulaciones" ? "active" : ""}`}
            onClick={() => setActiveTab("mis-postulaciones")}
          >
            📬 Mis postulaciones
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">Cargando...</div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <p>No hay {activeTab === "mis-solicitudes" ? "solicitudes" : "postulaciones"}</p>
        </div>
      ) : (
        <div className="groups-list">
          {groups.map((group) => {
            const canJoin = isActionAvailable(group.status, "join");
            return (
              <div key={group.id} className="group-card">
                <div className="card-header">
                  <div className="group-info">
                    <h3>{group.title}</h3>
                    <p className="subject">{group.subject?.name ?? "Sin materia"}</p>
                  </div>
                  <GroupStatusBadge status={group.status} size="small" />
                </div>

                {group.max_members && (
                  <div className="card-stats">
                    <span>👥 {group.members_count ?? 0}/{group.max_members}</span>
                  </div>
                )}

                <div className="card-footer">
                  <button
                    className="btn-secondary"
                    disabled={!canJoin && group.status === "llena"}
                    onClick={() => navigate(`/chat/${group.id}`)}
                    title={
                      !canJoin && group.status === "llena"
                        ? "Grupo lleno - no puedes unirte"
                        : ""
                    }
                  >
                    {!canJoin && group.status === "llena" ? "Grupo Lleno" : "Ver detalles"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
