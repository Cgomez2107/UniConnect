/**
 * app/(tabs)/feed.tsx
 *
 * Pantalla del feed — US-005 + US-006.
 * ORQUESTADOR puro: conecta los hooks useFeed, useStudentSearch y useResourceList
 * con los componentes visuales. Sin lógica de datos.
 *
 * Tres modos de búsqueda:
 *   - "solicitudes": feed normal de solicitudes de estudio
 *   - "compañeros":  búsqueda de estudiantes por materia (US-005)
 *   - "recursos":    recursos compartidos por materia (US-006)
 *
 * Lógica de datos  -> hooks/useFeed.ts, hooks/useStudentSearch.ts, hooks/useResources.ts
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
import { useFeed } from "@/hooks/useFeed";
import { useResourceList } from "@/hooks/useResources";
import { useStudentSearch } from "@/hooks/useStudentSearch";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FeedScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("solicitudes");

  // Hook de solicitudes (modo por defecto)
  const {
    filtered,
    userSubjects,
    loading,
    refreshing,
    loadingMore,
    error,
    search,
    setSearch,
    selectedSubjects,
    setSelectedSubjects,
    activeFilters,
    refresh,
    loadMore,
  } = useFeed();

  // Hook de búsqueda de compañeros (US-005)
  const studentSearch = useStudentSearch();

  // Hook de recursos por materia (US-006)
  const [resourceSubjectId, setResourceSubjectId] = useState<string | null>(null);
  const resourceList = useResourceList(resourceSubjectId);

  const handleOpenResource = useCallback(
    (item: { id: string }) => {
      router.push(`/recurso/${item.id}` as any)
    },
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <FeedHeader count={filtered.length} loading={loading} />

      {/* Toggle de modo de búsqueda */}
      <SearchModeToggle mode={searchMode} onChangeMode={setSearchMode} />

      {/* ── Modo Solicitudes ─────────────────────────────────────────── */}
      {searchMode === "solicitudes" && (
        <>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch("")}
            activeFilters={activeFilters}
            onOpenFilters={() => setShowFilters(true)}
          />

          {loading && !refreshing ? (
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
                  onPostulate={() => router.push(`/postular/${item.id}` as any)}
                />
              )}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 80 }}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color={C.primary} />
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  colors={[C.primary]}
                  tintColor={C.primary}
                />
              }
              ListEmptyComponent={
                error ? (
                  <EmptyState
                    emoji="⚠️"
                    title="Error al cargar"
                    body={error}
                    action="Reintentar"
                    onAction={refresh}
                  />
                ) : (
                  <EmptyState
                    emoji="🔍"
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

      {/* ── Modo Compañeros (US-005) ─────────────────────────────────── */}
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
                    title="Error en la búsqueda"
                    body={studentSearch.error}
                    action="Reintentar"
                    onAction={studentSearch.refresh}
                  />
                ) : (
                  <EmptyState
                    emoji="🔍"
                    title="Sin compañeros encontrados"
                    body="No hay otros estudiantes inscritos en esta materia."
                  />
                )
              }
            />
          )}
        </>
      )}

      {/* ── Modo Recursos (US-006) ───────────────────────────────────── */}
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
            <Text style={[styles.uploadFabText, { color: C.textOnPrimary }]}>
              📤 Subir recurso
            </Text>
          </TouchableOpacity>

          {!resourceSubjectId ? (
            <EmptyState
              emoji="📚"
              title="Selecciona una materia"
              body="Elige una materia para ver los recursos compartidos."
            />
          ) : resourceList.loading ? (
            <LoadingState message="Cargando recursos..." />
          ) : (
            <FlatList
              data={resourceList.resources}
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
              onEndReached={resourceList.loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                resourceList.loadingMore ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color={C.primary} />
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={resourceList.refreshing}
                  onRefresh={resourceList.refresh}
                  colors={[C.primary]}
                  tintColor={C.primary}
                />
              }
              ListEmptyComponent={
                resourceList.error ? (
                  <EmptyState
                    emoji="⚠️"
                    title="Error al cargar"
                    body={resourceList.error}
                    action="Reintentar"
                    onAction={resourceList.refresh}
                  />
                ) : (
                  <EmptyState
                    emoji="📭"
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
});