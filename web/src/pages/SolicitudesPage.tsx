import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import useFeed from "@/hooks/useFeed";
import { useProfileNames } from "@/hooks/useProfileNames";
import { useAcademicFilter } from "@uniconnect/shared-hooks";
import useSubjectOptions from "@/hooks/useSubjectOptions";
import { SolicitudCard } from "@/components/solicitud/SolicitudCard";
import { SubjectFilter } from "@/components/shared/SubjectFilter";
import { SubjectSelector } from "@/components/companions/SubjectSelector";
import { ClassmateCard } from "@/components/companions/ClassmateCard";
import { Button } from "@/components/ui/Button";
import { StudyRequestUI } from "@/types/ui";
import { deps } from "@/store/deps";
import useCompanions from "@/hooks/useCompanions";
import useNotifications from "@/hooks/useNotifications";

type FeedTab = "solicitudes" | "companeros";

export function SolicitudesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success } = useNotifications();
  const [activeTab, setActiveTab] = useState<FeedTab>("solicitudes");
  const filter = useAcademicFilter("solicitudes");
  const [companionSubjectId, setCompanionSubjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const showWelcome = sessionStorage.getItem("showWelcomeToast");
    if (showWelcome === "true") {
      sessionStorage.removeItem("showWelcomeToast");
      success("¡Bienvenido a UniConnect! 🎉 Tu correo de bienvenida llegará en los próximos 5 minutos a tu bandeja institucional.");
    }
  }, [success]);
  const fallbackSubjects = useMemo(
    () => ((user as any)?.studySubjects || []).map((s: any) => ({ id: s.id, name: s.name })),
    [user],
  );
  const { subjects: userSubjects } = useSubjectOptions(fallbackSubjects);
  const enrolledSubjectIds = useMemo(
    () => userSubjects.map((subject) => subject.id),
    [userSubjects],
  );
  const enrolledSubjectIdsKey = useMemo(
    () => enrolledSubjectIds.join("|"),
    [enrolledSubjectIds],
  );
  const feedSubjectIds = useMemo(
    () => (filter.selectedSubjectId ? [filter.selectedSubjectId] : enrolledSubjectIds),
    [filter.selectedSubjectId, enrolledSubjectIdsKey],
  );
  const {
    requests = [],
    applications = [],
    isLoading = false,
    isLoadingMore = false,
    error = null,
    hasMore = false,
    loadMore,
  } = useFeed({
    userId: user?.id,
    subjectIds: feedSubjectIds,
  }) as any;
  const { companions, isLoading: companionsLoading } = useCompanions(companionSubjectId ?? undefined);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const enrolledRequests = requests;

  const requestsWithMissingAuthor = useMemo(
    () => enrolledRequests.filter((r: any) => !r.creatorName && !r.profiles?.fullName).map((r: any) => r.authorId),
    [enrolledRequests],
  );
  const profileNames = useProfileNames(requestsWithMissingAuthor);

  const enrichedRequests = useMemo(
    () =>
      enrolledRequests.map((r: any) => {
        if (r.creatorName || r.profiles?.fullName) return r;
        const data = profileNames.get(r.authorId);
        if (!data?.fullName) return r;
        return {
          ...r,
          creatorName: data.fullName,
          profiles: { fullName: data.fullName, avatarUrl: data.avatarUrl },
        };
      }),
    [enrolledRequests, profileNames],
  );

  const applicationMap = useMemo(() => {
    const map = new Map<string, "pendiente" | "aceptada" | "rechazada">();
    for (const app of applications) {
      map.set((app as any).groupId || (app as any).requestId, app.status);
    }
    return map;
  }, [applications]);

  const filteredSolicitudes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return enrichedRequests as StudyRequestUI[];
    }

    return (enrichedRequests as StudyRequestUI[]).filter((item) => {
      const title = item.title?.toLowerCase() ?? "";
      const description = item.description?.toLowerCase() ?? "";
      const subjectName = item.subjectName?.toLowerCase() ?? "";
      return (
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        subjectName.includes(normalizedSearch)
      );
    });
  }, [enrichedRequests, searchTerm]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "300px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  const requestRoleMap = useMemo(() => {
    const map = new Map<string, { isAuthor: boolean; appStatus: string | null }>();
    for (const r of enrolledRequests) {
      map.set(r.id, {
        isAuthor: r.authorId === user?.id,
        appStatus: applicationMap.get(r.id) ?? null,
      });
    }
    return map;
  }, [enrolledRequests, applicationMap, user?.id]);

  const handleViewDetails = (id: string) => {
    const role = requestRoleMap.get(id);
    if (role?.isAuthor || role?.appStatus === "aceptada") {
      navigate(`/grupo/${id}`);
    } else {
      navigate(`/solicitud/${id}`);
    }
  };

  const handleApply = (id: string) => {
    navigate(`/postular/${id}`);
  };

  const handleSendMessage = async (targetUserId: string) => {
    try {
      const conversation = await deps.apiClients.messaging.createConversation(targetUserId);
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Grupos de Estudio
          </h1>
          <p className="text-neutral-500">
            Encuentra grupos de estudio y compañeros
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("solicitudes")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "solicitudes"
                ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-white shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            Solicitudes
          </button>
          <button
            onClick={() => setActiveTab("companeros")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "companeros"
                ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-white shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            Compañeros
          </button>
        </div>

        {/* Tab: Solicitudes */}
        {activeTab === "solicitudes" && (
          <>
            <div className="mb-6 space-y-4">
              <div className="card p-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por materia o descripcion..."
                  className="w-full bg-transparent outline-none text-neutral-900 placeholder:text-neutral-500"
                />
              </div>

              <SubjectFilter
                subjects={userSubjects}
                selectedId={filter.selectedSubjectId}
                onSelect={filter.selectSubject}
                totalCount={filteredSolicitudes.length}
              />
              <div className="flex justify-end">
                <Button onClick={() => navigate("/nueva-solicitud")}>
                  + Nuevo Grupo
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-36 skeleton rounded-lg" />
                ))}
              </div>
            )}

            {error && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700 text-sm">
                {error}
              </div>
            )}

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

            {!isLoading && filteredSolicitudes.length > 0 && hasMore && (
              <div className="py-6 flex items-center justify-center text-sm text-neutral-500">
                {isLoadingMore ? "Cargando más solicitudes..." : "Desplázate para cargar más"}
              </div>
            )}

            <div ref={loadMoreSentinelRef} className="h-4" />

            {!isLoading && filteredSolicitudes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500 mb-4">
                  {filter.selectedSubjectId
                    ? "No hay solicitudes para esta materia"
                    : "No hay solicitudes disponibles en tus materias inscritas"}
                </p>
                <Button onClick={() => navigate("/nueva-solicitud")}>
                  Crear el primer grupo
                </Button>
              </div>
            )}
          </>
        )}

        {/* Tab: Compañeros */}
        {activeTab === "companeros" && (
          <div>
            {/* Subject selector */}
            <div className="mb-6">
              <SubjectSelector
                subjects={userSubjects}
                selectedId={companionSubjectId}
                onSelect={setCompanionSubjectId}
              />
            </div>

            {!companionSubjectId && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-16 h-16 text-neutral-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  <path d="M8 7h8M8 11h6" />
                </svg>
                <h3 className="text-lg font-semibold text-neutral-700 mb-1">Selecciona una materia</h3>
                <p className="text-sm text-neutral-400">Busca compañeros que vean tus mismas clases</p>
              </div>
            )}

            {companionSubjectId && companionsLoading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 skeleton rounded-xl" />
                ))}
              </div>
            )}

            {companionSubjectId && !companionsLoading && companions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500">No hay compañeros en esta materia</p>
              </div>
            )}

            {companionSubjectId && !companionsLoading && companions.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companions.map((companion) => (
                  <ClassmateCard
                    key={companion.id}
                    classmate={{
                      id: companion.id,
                      fullName: companion.fullName,
                      avatarUrl: companion.avatarUrl,
                      programName: companion.programName,
                      semester: companion.semester,
                      bio: companion.bio,
                      sharedSubjectNames: companion.sharedSubjectIds
                        ? companion.sharedSubjectIds
                            .map((sid) => userSubjects.find((s) => s.id === sid)?.name)
                            .filter(Boolean) as string[]
                        : undefined,
                    }}
                    onViewProfile={(id) => navigate(`/perfil-estudiante/${id}`)}
                    onSendMessage={handleSendMessage}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SolicitudesPage;
