/**
 * app/(tabs)/feed.tsx
 */
import { FeedFilterModal } from "@/components/feed/FeedFilterModal";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { ResourceCard } from "@/components/feed/ResourceCard";
import { SearchBar } from "@/components/feed/SearchBar";
import { SearchModeToggle } from "@/components/feed/SearchModeToggle";
import { StudentCard } from "@/components/feed/StudentCard";
import { SubjectSelector } from "@/components/feed/SubjectSelector";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { CardSolicitud } from "@/components/ui/CardSolicitud";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useFeedScreen } from "@/hooks/application/useFeedScreen";
import type { StudyRequest, StudentSearchResult, StudyResource } from "@/types";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo } from "react";
import { useColorScheme } from "react-native";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FeedScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const {
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
    refreshResources,
    refreshingResources,
  } = useFeedScreen();

  const headerCount = useMemo(() => {
    if (searchMode === "solicitudes") return requests.length;
    if (searchMode === "recursos") return resources.length;
    return studentSearch.students.length;
  }, [searchMode, requests.length, resources.length, studentSearch.students.length]);

  const headerLoading = useMemo(() => {
    if (searchMode === "solicitudes") {
      return isFirstLoad && requestsLoading;
    }
    if (searchMode === "recursos") {
      return resourcesLoading && resources.length === 0;
    }
    return studentSearch.loading && studentSearch.students.length === 0;
  }, [
    isFirstLoad,
    requestsLoading,
    resources.length,
    resourcesLoading,
    searchMode,
    studentSearch.loading,
    studentSearch.students.length,
  ]);

  const openFilters = useCallback(() => {
    setShowFilters(true);
  }, [setShowFilters]);

  const closeFilters = useCallback(() => {
    setShowFilters(false);
  }, [setShowFilters]);

  const clearSearch = useCallback(() => {
    setSearch("");
  }, [setSearch]);

  const openRequest = useCallback((requestId: string) => {
    router.push(`/study-groups/${requestId}` as any);
  }, []);

  const openStudentProfile = useCallback((studentId: string) => {
    router.push(`/perfil-estudiante/${studentId}` as any);
  }, []);

  const openResource = useCallback((resourceId: string) => {
    router.push(`/recurso/${resourceId}` as any);
  }, []);

  const openUploadResource = useCallback(() => {
    router.push("/subir-recurso" as any);
  }, []);

  const requestKeyExtractor = useCallback((item: { id: string }) => item.id, []);
  const studentKeyExtractor = useCallback((item: { id: string }) => item.id, []);
  const resourceKeyExtractor = useCallback((item: { id: string }) => item.id, []);

  const requestListContentStyle = useMemo(
    () => ({ paddingTop: 8, paddingBottom: insets.bottom + 80 }),
    [insets.bottom],
  );

  const resourceListContentStyle = useMemo(
    () => ({ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 80 }),
    [insets.bottom],
  );

  const renderRequestItem = useCallback(
    ({ item }: { item: StudyRequest }) => (
      <CardSolicitud
        item={item}
        isOwnPost={item.author_id === user?.id}
        onPress={() => openRequest(item.id)}
        onPostulate={() => handlePostulateFromFeed(item.id)}
      />
    ),
    [user?.id, openRequest, handlePostulateFromFeed],
  );

  const renderStudentItem = useCallback(
    ({ item }: { item: StudentSearchResult }) => (
      <StudentCard student={item} onViewProfile={openStudentProfile} />
    ),
    [openStudentProfile],
  );

  const renderResourceItem = useCallback(
    ({ item }: { item: StudyResource }) => (
      <ResourceCard item={item} isOwn={item.user_id === user?.id} onOpen={(it) => openResource(it.id)} />
    ),
    [user?.id, openResource],
  );

  const requestsRefreshControl = useMemo(
    () => <RefreshControl refreshing={refreshingSolicitudes} onRefresh={fetchRequests} colors={[C.primary]} />,
    [refreshingSolicitudes, fetchRequests, C.primary],
  );

  const studentsRefreshControl = useMemo(
    () => <RefreshControl refreshing={false} onRefresh={studentSearch.refresh} colors={[C.primary]} />,
    [studentSearch.refresh, C.primary],
  );

  const resourcesRefreshControl = useMemo(
    () => <RefreshControl refreshing={refreshingResources} onRefresh={refreshResources} colors={[C.primary]} />,
    [refreshingResources, refreshResources, C.primary],
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <FeedHeader
        count={headerCount}
        loading={headerLoading}
        mode={searchMode}
      />

      <SearchModeToggle mode={searchMode} onChangeMode={setSearchMode} />

      {/* --- MODO SOLICITUDES --- */}
      {searchMode === "solicitudes" && (
        <>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onClear={clearSearch}
            activeFilters={selectedSubjects.length}
            onOpenFilters={openFilters}
          />

          {isFirstLoad && !requests.length ? (
            <LoadingState message="Cargando solicitudes..." />
          ) : (
            <FlatList
              data={requests}
              keyExtractor={requestKeyExtractor}
              renderItem={renderRequestItem}
              contentContainerStyle={requestListContentStyle}
              onEndReached={loadMoreRequests}
              onEndReachedThreshold={0.3}
              refreshControl={requestsRefreshControl}
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
            onClose={closeFilters}
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
              keyExtractor={studentKeyExtractor}
              renderItem={renderStudentItem}
              contentContainerStyle={requestListContentStyle}
              onEndReached={studentSearch.loadMore}
              refreshControl={studentsRefreshControl}
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

          <TouchableOpacity style={[styles.uploadFab, { backgroundColor: C.primary }]} onPress={openUploadResource}>
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
              keyExtractor={resourceKeyExtractor}
              renderItem={renderResourceItem}
              contentContainerStyle={resourceListContentStyle}
              refreshControl={resourcesRefreshControl}
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