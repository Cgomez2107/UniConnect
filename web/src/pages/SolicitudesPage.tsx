import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import useFeed from "@/hooks/useFeed";
import { useProfileNames } from "@/hooks/useProfileNames";
import { SolicitudCard } from "@/components/solicitud/SolicitudCard";
import { Button } from "@/components/ui/Button";
import { StudyRequestUI } from "@/types/ui";

export function SolicitudesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests = [], applications = [], isLoading = false, error = null } = useFeed({ userId: user?.id });
  const [searchTerm, setSearchTerm] = useState("");

  const requestsWithMissingAuthor = useMemo(
    () => requests.filter((r) => !r.creatorName && !r.profiles?.fullName).map((r) => r.authorId),
    [requests],
  );
  const profileNames = useProfileNames(requestsWithMissingAuthor);

  const enrichedRequests = useMemo(
    () =>
      requests.map((r) => {
        if (r.creatorName || r.profiles?.fullName) return r;
        const data = profileNames.get(r.authorId);
        if (!data?.fullName) return r;
        return {
          ...r,
          creatorName: data.fullName,
          profiles: { fullName: data.fullName, avatarUrl: data.avatarUrl },
        };
      }),
    [requests, profileNames],
  );

  const applicationMap = useMemo(() => {
    const map = new Map<string, "pendiente" | "aceptada" | "rechazada">();
    for (const app of applications) {
      map.set(app.requestId, app.status);
    }
    return map;
  }, [applications]);

  const filteredSolicitudes = useMemo(() => {
    return (enrichedRequests as StudyRequestUI[]).filter((sol) =>
      (sol.subjectName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) || (sol.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, enrichedRequests]);

  const handleViewDetails = (id: string) => {
    navigate(`/solicitud/${id}`);
  };

  const handleApply = (id: string) => {
    navigate(`/postular/${id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Solicitudes de Grupos de Estudio
          </h1>
          <p className="text-neutral-500">
            Encuentra y únete a grupos de estudio activos
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por materia o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
            />
          </div>
          <Button onClick={() => navigate("/nueva-solicitud")}>
            + Nuevo Grupo
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 skeleton rounded-lg" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700 text-sm">
            {error}
          </div>
        )}

        {/* Solicitudes Grid */}
        {!isLoading && filteredSolicitudes.length > 0 && (
          <div className="space-y-4">
            {filteredSolicitudes.map((solicitud: StudyRequestUI) => (
              <SolicitudCard
                key={solicitud.id}
                solicitud={solicitud}
                onViewDetails={handleViewDetails}
                onApply={handleApply}
                applicationStatus={applicationMap.get(solicitud.id) ?? null}
                isAuthor={solicitud.authorId === user?.id}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSolicitudes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">
              {searchTerm
                ? "No hay solicitudes que coincidan con tu búsqueda"
                : "No hay solicitudes disponibles"}
            </p>
            <Button onClick={() => navigate("/nueva-solicitud")}>
              Crear el primer grupo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SolicitudesPage;
