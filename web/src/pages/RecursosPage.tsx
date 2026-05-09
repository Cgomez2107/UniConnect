import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useResources from "@/hooks/useResources";
import { ResourceCard } from "@/components/shared/ResourceCard";
import { Button } from "@/components/ui/Button";

/**
 * RecursosPage - Display and manage study resources
 */
export function RecursosPage() {
  const navigate = useNavigate();
  const { resources = [], isLoading = false, error = null } = useResources() as any;
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let filtered = (resources || []);

    if (searchTerm) {
      filtered = filtered.filter(
        (res: any) =>
          (res.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (res.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResources(filtered);
  }, [searchTerm, resources]);

  const handleViewDetails = (id: string) => {
    navigate(`/recursos/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Deseas eliminar este recurso?")) {
      // TODO: Implement delete
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Recursos de Estudio
          </h1>
          <p className="text-neutral-600">
            Encuentra y comparte recursos educativos
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-48 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
          />
          <Button onClick={() => navigate("/subir-recurso")}>
            + Subir Recurso
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-neutral-200 rounded-lg animate-pulse"
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

        {/* Resources Grid */}
        {!isLoading && filteredResources.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource: any) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-600 mb-4">
              {searchTerm
                ? "No hay recursos que coincidan con tu búsqueda"
                : "No hay recursos disponibles"}
            </p>
            <Button onClick={() => navigate("/subir-recurso")}>
              Subir el primer recurso
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecursosPage;
