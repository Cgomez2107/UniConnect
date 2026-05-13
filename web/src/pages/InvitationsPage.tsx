import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "@/lib/api/client";
import { GroupStatusBadge, isActionAvailable } from "../components/GroupStatusBadge";

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
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-900">Mis Solicitudes</h1>
        </div>
        <div className="text-center py-12 text-neutral-500">
          <p>Inicia sesión para ver tus solicitudes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Mis Solicitudes</h1>
        <div className="flex gap-1 border-b border-neutral-200">
          <button
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "mis-solicitudes"
                ? "text-primary-700 border-primary-700"
                : "text-neutral-500 border-transparent hover:text-neutral-700"
            }`}
            onClick={() => setActiveTab("mis-solicitudes")}
          >
            📋 Mis solicitudes
          </button>
          <button
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "mis-postulaciones"
                ? "text-primary-700 border-primary-700"
                : "text-neutral-500 border-transparent hover:text-neutral-700"
            }`}
            onClick={() => setActiveTab("mis-postulaciones")}
          >
            📬 Mis postulaciones
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-neutral-500">Cargando...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p>No hay {activeTab === "mis-solicitudes" ? "solicitudes" : "postulaciones"}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const canJoin = isActionAvailable(group.status, "join");
            return (
              <div key={group.id} className="card-hover flex flex-col">
                <div className="p-5 border-b border-neutral-100 flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-primary-900 leading-tight">{group.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">{group.subject?.name ?? "Sin materia"}</p>
                  </div>
                  <GroupStatusBadge status={group.status} size="small" />
                </div>

                {group.max_members && (
                  <div className="px-5 py-2.5 bg-neutral-50 text-sm text-neutral-600 border-b border-neutral-100">
                    👥 {group.members_count ?? 0}/{group.max_members}
                  </div>
                )}

                <div className="p-5 mt-auto">
                  <button
                    className="w-full px-4 py-2.5 border-2 border-primary-600 text-primary-700 font-semibold rounded-lg text-sm hover:bg-primary-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary-700"
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
