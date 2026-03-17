/**
 * app/(tabs)/feed.tsx
 */
import { FeedFilterModal } from "@/components/feed/FeedFilterModal";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { ResourceCard } from "@/components/feed/ResourceCard";
import { SearchBar } from "@/components/feed/SearchBar";
import { SearchModeToggle, SearchMode } from "@/components/feed/SearchModeToggle";
import { StudentCard } from "@/components/feed/StudentCard";
import { SubjectSelector } from "@/components/feed/SubjectSelector";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { CardSolicitud } from "@/components/ui/CardSolicitud";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useApplications } from "@/hooks/application/useApplications";
import { useResources } from "@/hooks/application/useResources";
import { useStudyRequests } from "@/hooks/application/useStudyRequests";
import { useStudentSearch } from "@/hooks/application/useStudentSearch";
import {
  getEnrolledSubjectsForUser,
  type Subject as FeedSubject,
} from "@/hooks/application/useStudyRequestsCatalog";
import { useAuthStore } from "@/store/useAuthStore";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const REQUESTS_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export default function FeedScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  // Estados de control de UI
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("solicitudes");
  const [search, setSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Estados de datos
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<string[] | null>(null);
  const [userSubjects, setUserSubjects] = useState<FeedSubject[]>([]);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Datos específicos por modo
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsPage, setRequestsPage] = useState(0);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);
  const [loadingMoreRequests, setLoadingMoreRequests] = useState(false);
  const [refreshingSolicitudes, setRefreshingSolicitudes] = useState(false);

  const [resourceSubjectId, setResourceSubjectId] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [refreshingResources, setRefreshingResources] = useState(false);

  // Hooks de lógica
  const { loading: requestsLoading, error: requestsError, getRequests } = useStudyRequests();
  const { getMyApplicationStatus } = useApplications();
  const { loading: resourcesLoading, error: resourcesError, getResourcesBySubject } = useResources();
  const studentSearch = useStudentSearch();

  // Refs para control de efectos
  const hasMountedRef = useRef(false);
  const isFirstFocusRef = useRef(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeSubjectIds = useMemo(() => {
    if (selectedSubjects.length > 0) return selectedSubjects;
    return enrolledSubjectIds ?? [];
  }, [selectedSubjects, enrolledSubjectIds]);

  // --- LÓGICA DE SOLICITUDES ---
  const fetchRequests = useCallback(
    async (overrideSearch?: string) => {
      if (!subjectsLoaded || enrolledSubjectIds === null) return;
      try {
        const result = await getRequests(
          {
            subjectIds: activeSubjectIds.length > 0 ? activeSubjectIds : undefined,
            search: (overrideSearch ?? search).trim() || undefined,
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
    [activeSubjectIds, enrolledSubjectIds, getRequests, search, subjectsLoaded],
  );

  // --- LÓGICA DE RECURSOS ---
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

  // 1. Carga inicial de materias
  useEffect(() => {
    getEnrolledSubjectsForUser()
      .then((subjects) => {
        setUserSubjects(subjects);
        setEnrolledSubjectIds(subjects.map((s) => s.id));
      })
      .catch(() => {
        setUserSubjects([]);
        setEnrolledSubjectIds([]);
      })
      .finally(() => setSubjectsLoaded(true));
  }, []);

  // 2. Efecto disparador según modo y filtros
  useEffect(() => {
    if (!subjectsLoaded || enrolledSubjectIds === null) return;

    if (searchMode === "solicitudes") {
      fetchRequests().catch(() => undefined);
    } else if (searchMode === "recursos" && resourceSubjectId) {
      fetchResources(resourceSubjectId).catch(() => undefined);
    }

    hasMountedRef.current = true;
  }, [subjectsLoaded, enrolledSubjectIds, searchMode, selectedSubjects, resourceSubjectId]);

  // 3. Debounce de búsqueda
  useEffect(() => {
    if (!hasMountedRef.current || searchMode !== "solicitudes") return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchRequests().catch(() => undefined);
    }, SEARCH_DEBOUNCE_MS);

    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [search]);

  // 4. Refresco al foco (cuando vuelves de crear solicitud)
  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current || isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      if (searchMode === "solicitudes") fetchRequests().catch(() => undefined);
    }, [fetchRequests, searchMode]),
  );

  const loadMoreRequests = useCallback(async () => {
    if (!subjectsLoaded || !hasMoreRequests || loadingMoreRequests || requestsLoading || !!requestsError) return;
    setLoadingMoreRequests(true);
    try {
      const nextPage = requestsPage + 1;
      const result = await getRequests(
        {
          subjectIds: activeSubjectIds.length > 0 ? activeSubjectIds : undefined,
          search: search.trim() || undefined,
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
  }, [activeSubjectIds, getRequests, hasMoreRequests, loadingMoreRequests, requestsError, requestsLoading, requestsPage, search, subjectsLoaded]);

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

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <FeedHeader
        count={searchMode === "solicitudes" ? requests.length : searchMode === "recursos" ? resources.length : studentSearch.students.length}
        loading={requestsLoading || resourcesLoading || studentSearch.loading}
        mode={searchMode}
      />

      <SearchModeToggle mode={searchMode} onChangeMode={setSearchMode} />

      {/* --- MODO SOLICITUDES --- */}
      {searchMode === "solicitudes" && (
        <>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch("")}
            activeFilters={selectedSubjects.length}
            onOpenFilters={() => setShowFilters(true)}
          />

          {isFirstLoad && !requests.length ? (
            <LoadingState message="Cargando solicitudes..." />
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CardSolicitud
                  item={item}
                  isOwnPost={item.author_id === user?.id}
                  onPress={() => router.push(`/solicitud/${item.id}` as any)}
                  onPostulate={() => handlePostulateFromFeed(item.id)}
                />
              )}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 80 }}
              onEndReached={loadMoreRequests}
              onEndReachedThreshold={0.3}
              refreshControl={<RefreshControl refreshing={refreshingSolicitudes} onRefresh={fetchRequests} colors={[C.primary]} />}
              ListEmptyComponent={
                requestsError ? (
                  <EmptyState emoji="⚠️" title="Error de conexión" body={requestsError} action="Reintentar" onAction={fetchRequests} />
                ) : (
                  <EmptyState emoji="🔍" title="Sin resultados" body="No hay solicitudes para tus materias." />
                )
              }
              ListFooterComponent={loadingMoreRequests ? <ActivityIndicator style={{ margin: 20 }} /> : null}
            />
          )}

          <FeedFilterModal
            visible={showFilters}
            onClose={() => setShowFilters(false)}
            selectedSubjects={selectedSubjects}
            onSelectSubjects={setSelectedSubjects}
            subjects={userSubjects}
            bottomInset={insets.bottom}
          />
        </>
      )}

      {/* --- MODO COMPAÑEROS --- */}
      {searchMode === "compañeros" && (
        <>
          <SubjectSelector
            subjects={studentSearch.userSubjects}
            selectedId={studentSearch.selectedSubjectId}
            onSelect={studentSearch.selectSubject}
          />

          {!studentSearch.selectedSubjectId ? (
            <EmptyState emoji="📚" title="Selecciona una materia" body="Busca compañeros que vean tus mismas clases." />
          ) : studentSearch.loading && !studentSearch.students.length ? (
            <LoadingState message="Buscando compañeros..." />
          ) : (
            <FlatList
              data={studentSearch.students}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <StudentCard student={item} onViewProfile={(id) => router.push(`/perfil-estudiante/${id}` as any)} />
              )}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 80 }}
              onEndReached={studentSearch.loadMore}
              refreshControl={<RefreshControl refreshing={false} onRefresh={studentSearch.refresh} colors={[C.primary]} />}
              ListEmptyComponent={<EmptyState emoji="🔍" title="Sin compañeros" body="No hay otros estudiantes en esta materia." />}
            />
          )}
        </>
      )}

      {/* --- MODO RECURSOS --- */}
      {searchMode === "recursos" && (
        <>
          <SubjectSelector
            subjects={userSubjects}
            selectedId={resourceSubjectId}
            onSelect={setResourceSubjectId}
          />

          <TouchableOpacity style={[styles.uploadFab, { backgroundColor: C.primary }]} onPress={() => router.push("/subir-recurso" as any)}>
            <View style={styles.uploadFabInline}>
              <Ionicons name="cloud-upload-outline" size={17} color={C.textOnPrimary} />
              <Text style={[styles.uploadFabText, { color: C.textOnPrimary }]}>Subir recurso</Text>
            </View>
          </TouchableOpacity>

          {!resourceSubjectId ? (
            <EmptyState emoji="📚" title="Selecciona una materia" body="Mira los apuntes y recursos compartidos." />
          ) : resourcesLoading && !resources.length ? (
            <LoadingState message="Cargando recursos..." />
          ) : (
            <FlatList
              data={resources}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ResourceCard item={item} isOwn={item.user_id === user?.id} onOpen={(it) => router.push(`/recurso/${it.id}` as any)} />
              )}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 80 }}
              refreshControl={<RefreshControl refreshing={refreshingResources} onRefresh={refreshResources} colors={[C.primary]} />}
              ListEmptyComponent={<EmptyState emoji="📭" title="Sin recursos" body="Sé el primero en compartir algo aquí." />}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  uploadFab: { marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  uploadFabText: { fontSize: 14, fontWeight: "600" },
  uploadFabInline: { flexDirection: "row", alignItems: "center", gap: 8 },
});