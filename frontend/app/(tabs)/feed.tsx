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
import { useFeedScreen, type SearchMode } from "@/hooks/application/useFeedScreen";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
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