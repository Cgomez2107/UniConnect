import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import useFeed from "@/hooks/useFeed";
import { SolicitudCard } from "@/components/solicitud/SolicitudCard";
import { Button } from "@/components/ui/Button";

/**
 * SolicitudesPage - Display and manage study group requests/solicitudes
 */
export function SolicitudesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests = [], isLoading = false, error = null } = useFeed() as any;
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const filtered = (requests || []).filter((sol: any) =>
      (sol.subject?.name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) || (sol.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
    setFilteredSolicitudes(filtered);
  }, [searchTerm, requests]);

  const handleViewDetails = (id: string) => {
    navigate(`/solicitud/${id}`);
  };

  const handleApply = (id: string) => {
    navigate(`/postular/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solicitudes de Grupos de Estudio
          </h1>
          <p className="text-gray-600">
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
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-uc-blue"
          />
          <Button onClick={() => navigate("/nueva-solicitud")}>
            + Nueva Solicitud
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Solicitudes Grid */}
        {!isLoading && filteredSolicitudes.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSolicitudes.map((solicitud: any) => (
              <SolicitudCard
                key={solicitud.id}
                solicitud={solicitud}
                onViewDetails={handleViewDetails}
                onApply={handleApply}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSolicitudes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
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
