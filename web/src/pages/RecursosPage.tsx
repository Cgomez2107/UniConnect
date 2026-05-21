import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAcademicFilter } from "@uniconnect/shared-hooks";
import { deps } from "@/store/deps";
import useResources from "@/hooks/useResources";
import useSubjectOptions from "@/hooks/useSubjectOptions";
import { SubjectFilter } from "@/components/shared/SubjectFilter";
import { ResourceCard } from "@/components/shared/ResourceCard";
import { Button } from "@/components/ui/Button";

const CONTENT_TYPES = ["todos", "pdf", "document", "video", "link", "image"] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  todos: "Todos",
  pdf: "PDF",
  document: "Documento",
  video: "Video",
  link: "Enlace",
  image: "Imagen",
};

export function RecursosPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { resources = [], isLoading = false, error = null, refresh } = useResources() as any;
  const filter = useAcademicFilter("recursos");
  const [activeTab, setActiveTab] = useState<"todos" | "mis-recursos">("todos");
  const [activeType, setActiveType] = useState<ContentType>("todos");

  const fallbackSubjects = useMemo(
    () => ((user as any)?.studySubjects || []).map((s: any) => ({ id: s.id, name: s.name })),
    [user],
  );
  const { subjects: userSubjects } = useSubjectOptions(fallbackSubjects);

  useEffect(() => {
    void refresh({
      subjectId: filter.selectedSubjectId ?? undefined,
      userId: activeTab === "mis-recursos" ? user?.id : undefined,
    });
  }, [activeTab, filter.selectedSubjectId, refresh, user?.id]);

  const filteredResources = useMemo(() => {
    let mapped = (resources || []).map((r: any) => ({
      ...r,
      subjectName: r.subjects?.name || r.subjectName,
      uploaderName: r.profiles?.fullName,
    }));

    if (activeType !== "todos") {
      mapped = mapped.filter(
        (r: any) => (r.fileType || "").toLowerCase().includes(activeType),
      );
    }

    return mapped;
  }, [resources, activeType]);

  const handleViewDetails = (id: string) => {
    navigate(`/recursos/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Deseas eliminar este recurso?")) {
      try {
        await deps.apiClients.resources.delete(id);
        refresh();
      } catch (err) {
        console.error("Error deleting resource:", err);
      }
    }
  };

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/recursos/${id}?editar=true`);
    },
    [navigate],
  );

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Biblioteca de Recursos
          </h1>
          <p className="text-neutral-500">
            Encuentra y comparte recursos educativos
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-4 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab("todos")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "todos"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab("mis-recursos")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "mis-recursos"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Mis recursos
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <SubjectFilter
            subjects={userSubjects}
            selectedId={filter.selectedSubjectId}
            onSelect={filter.selectSubject}
            totalCount={resources.length}
          />

          {/* Type filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-1">
              Tipo:
            </span>
            {CONTENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeType === type
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                {CONTENT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <div className="flex sm:justify-end">
            <Button onClick={() => navigate("/subir-recurso")} className="w-full sm:w-auto">
              + Subir Recurso
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 skeleton rounded-lg" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700 text-sm">
            {error}
          </div>
        )}

        {/* Resources Grid */}
        {!isLoading && filteredResources.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource: any) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
                onEdit={handleEdit}
                isOwner={user?.id === resource.userId}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">
              {filter.selectedSubjectId || activeType !== "todos"
                ? "No hay recursos para esta combinación de filtros"
                : activeTab === "mis-recursos"
                  ? "No has subido recursos todavía"
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
