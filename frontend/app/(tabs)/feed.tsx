/**
 * app/(tabs)/feed.tsx
 *
 * Pantalla del feed — US-005 + US-006.
 * ORQUESTADOR puro: conecta hooks de aplicación (arquitectura limpia)
 * y componentes visuales.
 *
 * Tres modos de búsqueda:
 *   - "solicitudes": feed normal de solicitudes de estudio
 *   - "compañeros":  búsqueda de estudiantes por materia (US-005)
 *   - "recursos":    recursos compartidos por materia (US-006)
 *
 * Lógica de datos  -> hooks/application/useStudyRequests.ts,
 *                    hooks/application/useApplications.ts,
 *                    hooks/application/useResources.ts,
 *                    hooks/useStudentSearch.ts
 * Componentes      -> components/feed/
 * Componentes UI   -> components/shared/
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
import { getEnrolledSubjectsForUser, type Subject as FeedSubject } from "@/hooks/application/useStudyRequestsCatalog";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const REQUESTS_PAGE_SIZE = 10;

export default function FeedScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("solicitudes");
  const [search, setSearch] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [userSubjects, setUserSubjects] = useState<FeedSubject[]>([]);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [initialRequestsLoaded, setInitialRequestsLoaded] = useState(false);
  const [requestsPage, setRequestsPage] = useState(0);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);
  const [loadingMoreRequests, setLoadingMoreRequests] = useState(false);
  const [refreshingSolicitudes, setRefreshingSolicitudes] = useState(false);
  const [refreshingResources, setRefreshingResources] = useState(false);

  const {
    loading: requestsLoading,
    error: requestsError,
    getRequests,
  } = useStudyRequests();
  const { getMyApplicationStatus } = useApplications();
  const {
    loading: resourcesLoading,
    error: resourcesError,
    getResourcesBySubject,
  } = useResources();

  // Datos de compañeros y recursos por materia.
  const studentSearch = useStudentSearch();
  const [resourceSubjectId, setResourceSubjectId] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);

  const enrolledSubjectIds = useMemo(
    () => userSubjects.map((s) => s.id),
    [userSubjects]
  );

  const fetchRequests = useCallback(async () => {
    if (!subjectsLoaded) return;

    setInitialRequestsLoaded(false);
    try {
      const result = await getRequests(
        { search: search.trim() || undefined },
        0,
        REQUESTS_PAGE_SIZE
      );

      const filteredByEnrollment =
        enrolledSubjectIds.length > 0
          ? result.filter((r: any) => enrolledSubjectIds.includes(r.subject_id))
          : [];

      setRequests(filteredByEnrollment);
      setRequestsPage(0);
      setHasMoreRequests(result.length >= REQUESTS_PAGE_SIZE);
    } finally {
      setInitialRequestsLoaded(true);
    }
  }, [enrolledSubjectIds, getRequests, search, subjectsLoaded]);

  const fetchResources = useCallback(
    async (subjectId: string) => {
      const result = await getResourcesBySubject(subjectId);
      setResources(result);
    },
    [getResourcesBySubject]
  );

  useEffect(() => {
    getEnrolledSubjectsForUser()
      .then((subjects) => setUserSubjects(subjects))
      .catch(() => setUserSubjects([]))
      .finally(() => setSubjectsLoaded(true));
  }, []);

  useEffect(() => {
    if (searchMode !== "solicitudes") return;
    fetchRequests().catch(() => undefined);
  }, [searchMode, fetchRequests]);

  useEffect(() => {
    if (searchMode !== "recursos") return;
    if (!resourceSubjectId) {
      setResources([]);
      return;
    }
    fetchResources(resourceSubjectId).catch(() => undefined);
  }, [searchMode, resourceSubjectId, fetchResources]);

  const filtered = useMemo(() => {
    if (selectedSubjects.length === 0) return requests;
    return requests.filter((r) => selectedSubjects.includes(r.subject_id));
  }, [requests, selectedSubjects]);

  const activeFilters = selectedSubjects.length;

  const refreshSolicitudes = useCallback(async () => {
    setRefreshingSolicitudes(true);
    try {
      await fetchRequests();
    } finally {
      setRefreshingSolicitudes(false);
    }
  }, [fetchRequests]);

  const refreshResources = useCallback(async () => {
    if (!resourceSubjectId) return;
    setRefreshingResources(true);
    try {
      await fetchResources(resourceSubjectId);
    } finally {
      setRefreshingResources(false);
    }
  }, [fetchResources, resourceSubjectId]);

  const loadMoreRequests = useCallback(async () => {
    if (!subjectsLoaded || !hasMoreRequests || loadingMoreRequests || requestsLoading) return;

    setLoadingMoreRequests(true);
    try {
      const nextPage = requestsPage + 1;
      const result = await getRequests(
        { search: search.trim() || undefined },
        nextPage,
        REQUESTS_PAGE_SIZE
      );

      const filteredByEnrollment =
        enrolledSubjectIds.length > 0
          ? result.filter((r: any) => enrolledSubjectIds.includes(r.subject_id))
          : [];

      if (filteredByEnrollment.length > 0) {
        setRequests((prev) => [...prev, ...filteredByEnrollment]);
      }

      setRequestsPage(nextPage);
      setHasMoreRequests(result.length >= REQUESTS_PAGE_SIZE);
    } finally {
      setLoadingMoreRequests(false);
    }
  }, [enrolledSubjectIds, getRequests, hasMoreRequests, loadingMoreRequests, requestsLoading, requestsPage, search, subjectsLoaded]);

  const handleOpenResource = useCallback(
    (item: { id: string }) => {
      router.push(`/recurso/${item.id}` as any)
    },
    []
  );

  const handlePostulateFromFeed = useCallback(
    async (requestId: string) => {
      if (!user?.id) {
        Alert.alert("Sesion requerida", "Debes iniciar sesion para postularte.");
        router.push("/login" as any);
        return;
      }

      try {
        const status = await getMyApplicationStatus(requestId, user.id);
        if (status) {
          if (status === "aceptada") {
            Alert.alert("Ya fuiste aceptado", "Esta solicitud ya te acepto. Puedes verla en Solicitudes > Mis postulaciones.");
            return;
          }

          if (status === "pendiente") {
            Alert.alert("Postulacion existente", "Ya te postulaste a esta solicitud y esta pendiente de revision.");
            return;
          }

          Alert.alert("Postulacion existente", "Ya te postulaste a esta solicitud.");
          return;
        }

        router.push(`/postular/${requestId}` as any);
      } catch {
        Alert.alert("Error", "No se pudo validar tu estado de postulacion. Intenta nuevamente.");
      }
    },
    [getMyApplicationStatus, user?.id]
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <FeedHeader count={filtered.length} loading={!subjectsLoaded || requestsLoading} mode={searchMode} />

      {/* Toggle de modo de búsqueda */}
      <SearchModeToggle mode={searchMode} onChangeMode={setSearchMode} />

      {searchMode === "solicitudes" && (
        <>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch("")}
            activeFilters={activeFilters}
            onOpenFilters={() => setShowFilters(true)}
          />

          {!subjectsLoaded || (!initialRequestsLoaded && requestsLoading && !refreshingSolicitudes) ? (
            <LoadingState message="Cargando solicitudes..." />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CardSolicitud
                  item={item as any}
                  isOwnPost={item.author_id === user?.id}
                  onPress={() => router.push(`/solicitud/${item.id}` as any)}
                  onPostulate={() => handlePostulateFromFeed(item.id)}
                />
              )}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 80 }}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMoreRequests}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMoreRequests ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color={C.primary} />
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshingSolicitudes}
                  onRefresh={refreshSolicitudes}
                  colors={[C.primary]}
                  tintColor={C.primary}
                />
              }
              ListEmptyComponent={
                requestsError ? (
                  <EmptyState
                    emoji="⚠️"
                    iconName="warning-outline"
                    title="Error al cargar"
                    body={requestsError}
                    action="Reintentar"
                    onAction={refreshSolicitudes}
                  />
                ) : (
                  <EmptyState
                    emoji="🔍"
                    iconName="search-outline"
                    title="Sin resultados"
                    body="Intenta con otros filtros o crea la primera solicitud."
                  />
                )
              }
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

      {searchMode === "compañeros" && (
        <>
          <SubjectSelector
            subjects={studentSearch.userSubjects}
            selectedId={studentSearch.selectedSubjectId}
            onSelect={studentSearch.selectSubject}
          />

          {!studentSearch.selectedSubjectId ? (
            <EmptyState
              emoji="📚"
              iconName="book-outline"
              title="Selecciona una materia"
              body="Elige una materia para buscar compañeros que la estén cursando."
            />
          ) : studentSearch.loading ? (
            <LoadingState message="Buscando compañeros..." />
          ) : (
            <FlatList
              data={studentSearch.students}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <StudentCard
                  student={item}
                  onViewProfile={(id) =>
                    router.push(`/perfil-estudiante/${id}` as any)
                  }
                />
              )}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 80 }}
              showsVerticalScrollIndicator={false}
              onEndReached={studentSearch.loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                studentSearch.loadingMore ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color={C.primary} />
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={studentSearch.refresh}
                  colors={[C.primary]}
                  tintColor={C.primary}
                />
              }
              ListEmptyComponent={
                studentSearch.error ? (
                  <EmptyState
                    emoji="⚠️"
                    iconName="warning-outline"
                    title="Error en la búsqueda"
                    body={studentSearch.error}
                    action="Reintentar"
                    onAction={studentSearch.refresh}
                  />
                ) : (
                  <EmptyState
                    emoji="🔍"
                    iconName="search-outline"
                    title="Sin compañeros encontrados"
                    body="No hay otros estudiantes inscritos en esta materia."
                  />
                )
              }
            />
          )}
        </>
      )}

      {searchMode === "recursos" && (
        <>
          <SubjectSelector
            subjects={studentSearch.userSubjects}
            selectedId={resourceSubjectId}
            onSelect={setResourceSubjectId}
          />

          {/* Botón para subir recurso */}
          <TouchableOpacity
            style={[styles.uploadFab, { backgroundColor: C.primary }]}
            onPress={() => router.push("/subir-recurso" as any)}
            activeOpacity={0.85}
          >
            <View style={styles.uploadFabInline}>
              <Ionicons name="cloud-upload-outline" size={17} color={C.textOnPrimary} />
              <Text style={[styles.uploadFabText, { color: C.textOnPrimary }]}>Subir recurso</Text>
            </View>
          </TouchableOpacity>

          {!resourceSubjectId ? (
            <EmptyState
              emoji="📚"
              iconName="book-outline"
              title="Selecciona una materia"
              body="Elige una materia para ver los recursos compartidos."
            />
          ) : resourcesLoading && !refreshingResources ? (
            <LoadingState message="Cargando recursos..." />
          ) : (
            <FlatList
              data={resources}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ResourceCard
                  item={item}
                  isOwn={item.user_id === user?.id}
                  onOpen={handleOpenResource}
                />
              )}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 80 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingResources}
                  onRefresh={refreshResources}
                  colors={[C.primary]}
                  tintColor={C.primary}
                />
              }
              ListEmptyComponent={
                resourcesError ? (
                  <EmptyState
                    emoji="⚠️"
                    iconName="warning-outline"
                    title="Error al cargar"
                    body={resourcesError}
                    action="Reintentar"
                    onAction={refreshResources}
                  />
                ) : (
                  <EmptyState
                    emoji="📭"
                    iconName="folder-open-outline"
                    title="Sin recursos"
                    body="Aún no hay recursos compartidos para esta materia. ¡Sé el primero en compartir!"
                    action="Subir recurso"
                    onAction={() => router.push("/subir-recurso" as any)}
                  />
                )
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  uploadFab: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  uploadFabText: { fontSize: 14, fontWeight: "600" },
  uploadFabInline: { flexDirection: "row", alignItems: "center", gap: 8 },
});