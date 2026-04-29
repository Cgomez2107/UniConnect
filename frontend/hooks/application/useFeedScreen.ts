import { useApplications } from "@/hooks/application/useApplications";
import { useResources } from "@/hooks/application/useResources";
import { useStudentSearch } from "@/hooks/application/useStudentSearch";
import { useStudyRequests } from "@/hooks/application/useStudyRequests";
import {
  getEnrolledSubjectsForUser,
  type Subject as FeedSubject,
} from "@/hooks/application/useStudyRequestsCatalog";
import { useAuthStore } from "@/store/useAuthStore";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

export type SearchMode = "solicitudes" | "compañeros" | "recursos";

const REQUESTS_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export function useFeedScreen() {
  const user = useAuthStore((s) => s.user);

  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("solicitudes");
  const [search, setSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<string[] | null>(null);
  const [userSubjects, setUserSubjects] = useState<FeedSubject[]>([]);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const [requests, setRequests] = useState<any[]>([]);
  const [requestsPage, setRequestsPage] = useState(0);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);
  const [loadingMoreRequests, setLoadingMoreRequests] = useState(false);
  const [refreshingSolicitudes] = useState(false);

  const [resourceSubjectId, setResourceSubjectId] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [refreshingResources, setRefreshingResources] = useState(false);

  const { loading: requestsLoading, error: requestsError, getRequests } = useStudyRequests();
  const { getMyApplicationStatus } = useApplications();
  const { loading: resourcesLoading, error: resourcesError, getResourcesBySubject } = useResources();
  const studentSearch = useStudentSearch();

  const hasMountedRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSubjectIds = useMemo(() => {
    if (selectedSubjects.length > 0) return selectedSubjects;
    return enrolledSubjectIds ?? [];
  }, [selectedSubjects, enrolledSubjectIds]);

  const normalizeSearch = useCallback(
    (value: unknown): string | undefined => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }

      const fallback = typeof search === "string" ? search.trim() : "";
      return fallback.length > 0 ? fallback : undefined;
    },
    [search],
  );

  const fetchRequests = useCallback(
    async (overrideSearch?: unknown, overrideSubjectIds?: string[]) => {
      if (!subjectsLoaded || enrolledSubjectIds === null) return;

      // Regla de negocio: sin materias inscritas, no hay solicitudes para mostrar.
      if (enrolledSubjectIds.length === 0) {
        setRequests([]);
        setRequestsPage(0);
        setHasMoreRequests(false);
        setIsFirstLoad(false);
        return;
      }

      try {
        const effectiveSubjectIds = overrideSubjectIds ?? activeSubjectIds;
        const result = await getRequests(
          {
            subjectIds: effectiveSubjectIds,
            search: normalizeSearch(overrideSearch),
          } as any,
          0,
          REQUESTS_PAGE_SIZE,
        );
        setRequests(result);
        setRequestsPage(0);
        setHasMoreRequests(result.length >= REQUESTS_PAGE_SIZE);
      } finally {
        setIsFirstLoad(false);
      }
    },
    [activeSubjectIds, enrolledSubjectIds, getRequests, normalizeSearch, subjectsLoaded],
  );

  const refreshEnrolledSubjects = useCallback(async (): Promise<string[]> => {
    try {
      const subjects = await getEnrolledSubjectsForUser();
      const ids = subjects.map((s) => s.id);

      setUserSubjects(subjects);
      setEnrolledSubjectIds(ids);
      setSelectedSubjects((prev) => prev.filter((id) => ids.includes(id)));

      return ids;
    } catch {
      setUserSubjects([]);
      setEnrolledSubjectIds([]);
      setSelectedSubjects([]);
      return [];
    } finally {
      setSubjectsLoaded(true);
    }
  }, []);

  const fetchResources = useCallback(
    async (subjectId: string) => {
      try {
        const result = await getResourcesBySubject(subjectId);
        setResources(result);
      } catch {
        setResources([]);
      } finally {
        setIsFirstLoad(false);
      }
    },
    [getResourcesBySubject],
  );

  // Load enrolled subjects once on mount
  useEffect(() => {
    if (!hasMountedRef.current) {
      refreshEnrolledSubjects().catch(() => undefined);
      hasMountedRef.current = true;
    }
  }, []);

  // Fetch requests when subjects or search mode changes
  useEffect(() => {
    if (!subjectsLoaded || enrolledSubjectIds === null) return;

    if (searchMode === "solicitudes" && enrolledSubjectIds.length > 0) {
      fetchRequests().catch(() => undefined);
    } else if (searchMode === "recursos" && resourceSubjectId) {
      fetchResources(resourceSubjectId).catch(() => undefined);
    }
  }, [subjectsLoaded, enrolledSubjectIds, searchMode, selectedSubjects, resourceSubjectId]);

  // Handle search debouncing without depending on fetchRequests function
  useEffect(() => {
    if (!subjectsLoaded || searchMode !== "solicitudes") return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchRequests().catch(() => undefined);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search, searchMode]);

  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) return;

      if (searchMode !== "solicitudes") return;

      refreshEnrolledSubjects()
        .then((ids) => {
          if (ids.length === 0) {
            setRequests([]);
            setRequestsPage(0);
            setHasMoreRequests(false);
            setIsFirstLoad(false);
            return;
          }

          return fetchRequests(undefined, ids);
        })
        .catch(() => undefined);
    }, [fetchRequests, refreshEnrolledSubjects, searchMode]),
  );

  const loadMoreRequests = useCallback(async () => {
    if (!subjectsLoaded || !hasMoreRequests || loadingMoreRequests || requestsLoading || !!requestsError) return;
    if (!enrolledSubjectIds || enrolledSubjectIds.length === 0) return;

    setLoadingMoreRequests(true);
    try {
      const nextPage = requestsPage + 1;
      const result = await getRequests(
        {
          subjectIds: activeSubjectIds,
          search: normalizeSearch(undefined),
        } as any,
        nextPage,
        REQUESTS_PAGE_SIZE,
      );
      if (result.length > 0) {
        setRequests((prev) => [...prev, ...result]);
        setRequestsPage(nextPage);
      }
      setHasMoreRequests(result.length >= REQUESTS_PAGE_SIZE);
    } catch {
      setHasMoreRequests(false);
    } finally {
      setLoadingMoreRequests(false);
    }
  }, [activeSubjectIds, enrolledSubjectIds, getRequests, hasMoreRequests, loadingMoreRequests, normalizeSearch, requestsError, requestsLoading, requestsPage, subjectsLoaded]);

  const handlePostulateFromFeed = useCallback(
    async (requestId: string) => {
      if (!user?.id) {
        Alert.alert("Sesión requerida", "Inicia sesión para postularte.");
        router.push("/login" as any);
        return;
      }
      try {
        const status = await getMyApplicationStatus(requestId, user.id);
        if (status) {
          const msgs: Record<string, string> = {
            aceptada: "Esta solicitud ya te aceptó.",
            pendiente: "Ya te postulaste y está pendiente.",
          };
          Alert.alert("Postulación existente", msgs[status] ?? "Ya te postulaste.");
          return;
        }
        router.push(`/postular/${requestId}` as any);
      } catch {
        Alert.alert("Error", "No se pudo validar tu estado.");
      }
    },
    [getMyApplicationStatus, user?.id],
  );

  const refreshResources = useCallback(async () => {
    if (!resourceSubjectId) return;
    setRefreshingResources(true);
    await fetchResources(resourceSubjectId);
    setRefreshingResources(false);
  }, [fetchResources, resourceSubjectId]);

  return {
    user,
    showFilters,
    setShowFilters,
    searchMode,
    setSearchMode,
    search,
    setSearch,
    selectedSubjects,
    setSelectedSubjects,
    userSubjects,
    isFirstLoad,
    requests,
    requestsLoading,
    requestsError,
    loadMoreRequests,
    loadingMoreRequests,
    refreshingSolicitudes,
    fetchRequests,
    handlePostulateFromFeed,
    studentSearch,
    resourceSubjectId,
    setResourceSubjectId,
    resources,
    resourcesLoading,
    resourcesError,
    refreshResources,
    refreshingResources,
  };
}
