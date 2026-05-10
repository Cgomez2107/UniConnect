import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import useFeed from "@/hooks/useFeed";
import { SolicitudCard } from "@/components/solicitud/SolicitudCard";
import { Button } from "@/components/ui/Button";
import { StudyRequestUI } from "@/types/ui";
import { typographyStyles } from "@uniconnect/shared-ui";

export function SolicitudesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests = [], applications = [], isLoading = false, error = null } = useFeed({ userId: user?.id });
  const [searchTerm, setSearchTerm] = useState("");

  const applicationMap = useMemo(() => {
    const map = new Map<string, "pendiente" | "aceptada" | "rechazada">();
    for (const app of applications) {
      map.set(app.request_id, app.status);
    }
    return map;
  }, [applications]);

  const filteredSolicitudes = useMemo(() => {
    return (requests as StudyRequestUI[]).filter((sol) =>
      (sol.subjectName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) || (sol.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, requests]);

  const handleViewDetails = (id: string) => {
    navigate(`/solicitud/${id}`);
  };

  const handleApply = (id: string) => {
    navigate(`/postular/${id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-neutral-900 mb-2"
            style={{
              fontSize: typographyStyles.h1.fontSize,
              fontWeight: typographyStyles.h1.fontWeight,
              lineHeight: typographyStyles.h1.lineHeight,
            }}
          >
            Solicitudes de Grupos de Estudio
          </h1>
          <p className="text-neutral-700">
            Encuentra y únete a grupos de estudio activos
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Buscar por materia o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-neutral-50 text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-600"
          />
          <Button onClick={() => navigate("/nueva-solicitud")}>
            + Nueva Solicitud
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 bg-neutral-100 border border-neutral-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700">
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
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSolicitudes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-700 mb-4">
              {searchTerm
                ? "No hay solicitudes que coincidan con tu búsqueda"
                : "No hay solicitudes disponibles"}
            </p>
            <Button onClick={() => navigate("/nueva-solicitud")}>
              Crear la primera solicitud
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SolicitudesPage;
