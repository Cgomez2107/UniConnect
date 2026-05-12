import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import useCompanions from "@/hooks/useCompanions";
import { Button } from "@/components/ui/Button";

export function CompanionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userSubjects = (user as any)?.subjects || [];
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const { companions, isLoading } = useCompanions(selectedSubject);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-600">Inicia sesión para ver compañeros</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Compañeros de Clase
          </h1>
          <p className="text-neutral-600">
            Estudiantes que comparten tus materias
          </p>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedSubject(undefined)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedSubject
                ? "bg-primary-600 text-white"
                : "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            Todos ({companions.length})
          </button>
          {userSubjects.map((subject: any) => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSubject === subject.id
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {subject.name}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-neutral-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && companions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-600 mb-4">
              {selectedSubject
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
                className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/perfil/${companion.id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                    {companion.fullName.charAt(0).toUpperCase()}
                  </div>
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
                  <p className="text-sm text-neutral-500 line-clamp-2">
                    {companion.bio}
                  </p>
                )}
                <div className="mt-2">
                  <Button variant="secondary" size="sm">
                    Ver perfil
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
