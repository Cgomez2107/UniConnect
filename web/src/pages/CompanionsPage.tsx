import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAcademicFilter } from "@uniconnect/shared-hooks";
import useCompanions from "@/hooks/useCompanions";
import useSubjectOptions from "@/hooks/useSubjectOptions";
import { SubjectFilter } from "@/components/shared/SubjectFilter";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { deps } from "@/store/deps";

export function CompanionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const filter = useAcademicFilter("compañeros");
  const fallbackSubjects = ((user as any)?.studySubjects || []).map((s: any) => ({ id: s.id, name: s.name }));
  const { subjects: userSubjects } = useSubjectOptions(fallbackSubjects);
  const { companions, isLoading } = useCompanions(filter.selectedSubjectId ?? undefined);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-600">Inicia sesión para ver compañeros</p>
      </div>
    );
  }

  const handleSendMessage = async (targetUserId: string) => {
    try {
      const conversation = await deps.apiClients.messaging.createConversation(targetUserId);
      navigate(`/mensajes/${conversation.id}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Compañeros de Clase
          </h1>
          <p className="text-neutral-500">
            Estudiantes que comparten tus materias
          </p>
        </div>

        <div className="mb-6">
          <SubjectFilter
            subjects={userSubjects}
            selectedId={filter.selectedSubjectId}
            onSelect={filter.selectSubject}
            totalCount={companions.length}
          />
        </div>

        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 skeleton" />
            ))}
          </div>
        )}

        {!isLoading && companions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">
              {filter.selectedSubjectId
                ? "No hay compañeros en esta materia"
                : "No hay compañeros. Asegúrate de tener materias asignadas."}
            </p>
          </div>
        )}

        {!isLoading && companions.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companions.map((companion) => (
              <div
                key={companion.id}
                className="card-hover p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    name={companion.fullName}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {companion.fullName}
                    </h3>
                    <p className="text-sm text-neutral-500 truncate">
                      {companion.programName || "Sin programa"}
                    </p>
                  </div>
                </div>
                {companion.semester && (
                  <p className="text-sm text-neutral-600 mb-2">
                    {companion.semester}° semestre
                  </p>
                )}
                {companion.bio && (
                  <p className="text-sm text-neutral-500 line-clamp-2 mb-3">
                    {companion.bio}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/perfil-estudiante/${companion.id}`)}
                  >
                    Ver perfil
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSendMessage(companion.id)}
                  >
                    Enviar mensaje
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompanionsPage;
