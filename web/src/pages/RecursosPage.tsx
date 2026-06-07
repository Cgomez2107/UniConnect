import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAcademicFilter } from "@uniconnect/shared-hooks";
import useResources from "@/hooks/useResources";
import useSubjectOptions from "@/hooks/useSubjectOptions";
import { SubjectFilter } from "@/components/shared/SubjectFilter";
import { ResourceCard } from "@/components/shared/ResourceCard";
import { Button } from "@/components/ui/Button";

const TYPE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "pdf", label: "PDF" },
  { value: "document", label: "Documentos" },
  { value: "video", label: "Videos" },
  { value: "link", label: "Enlaces" },
  { value: "image", label: "Imágenes" },
];

export function RecursosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { resources = [], isLoading = false, error = null, refresh, deleteResource } = useResources() as any;
  const filter = useAcademicFilter("recursos");
  const [activeTab, setActiveTab] = useState<"todos" | "mis-recursos">("todos");
  const [selectedType, setSelectedType] = useState<string>(searchParams.get("type") ?? "");

  const fallbackSubjects = useMemo(
    () => ((user as any)?.studySubjects || []).map((s: any) => ({ id: s.id, name: s.name })),
    [user],
  );
  const { subjects: userSubjects } = useSubjectOptions(fallbackSubjects);

  useEffect(() => {
    void refresh({
      subjectId: filter.selectedSubjectId ?? undefined,
      userId: activeTab === "mis-recursos" ? user?.id : undefined,
      type: selectedType || undefined,
    });
  }, [activeTab, filter.selectedSubjectId, refresh, user?.id, selectedType]);

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    setSearchParams((prev) => {
      if (type) {
        prev.set("type", type);
      } else {
        prev.delete("type");
      }
      return prev;
    }, { replace: true });
  };

  const filteredResources = useMemo(() => {
    const mapped = (resources || []).map((r: any) => ({
      ...r,
      subjectName: r.subjects?.name || r.subjectName,
      uploaderName: r.profiles?.fullName,
    }));

    return mapped;
  }, [resources]);

  const handleViewDetails = (id: string) => {
    navigate(`/recursos/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/recursos/${id}?editar=true`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Deseas eliminar este recurso?")) {
      try {
        await deleteResource(id);
      } catch (err) {
        console.error("Error deleting resource:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8">
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
          {/* Type filter buttons */}
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((tf) => (
              <button
                key={tf.value}
                onClick={() => handleTypeFilter(tf.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                  selectedType === tf.value
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <SubjectFilter
            subjects={userSubjects}
            selectedId={filter.selectedSubjectId}
            onSelect={filter.selectSubject}
            totalCount={resources.length}
          />
          <div className="flex justify-end">
            <Button onClick={() => navigate("/subir-recurso")}>
              + Subir Recurso
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 skeleton rounded-lg" />
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((resource: any) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isOwner={user?.id === resource.uploaderUserId || user?.id === resource.user_id}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">
              {selectedType
                ? `No hay recursos de tipo "${TYPE_FILTERS.find((t) => t.value === selectedType)?.label}"`
                : filter.selectedSubjectId
                  ? "No hay recursos para esta materia"
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
