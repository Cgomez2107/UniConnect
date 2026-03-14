/**
 * Pantalla principal del feed.
 * Integra solicitudes, búsqueda de compañeros y recursos de estudio.
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
import { useFeed } from "@/hooks/useFeed";
import { useResourceList } from "@/hooks/useResources";
import { useStudentSearch } from "@/hooks/useStudentSearch";
import { getMyApplicationStatus } from "@/lib/services/careerService";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
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

  // Datos de compañeros y recursos por materia.
  const studentSearch = useStudentSearch();
  const [resourceSubjectId, setResourceSubjectId] = useState<string | null>(null);
  const resourceList = useResourceList(resourceSubjectId);

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
    [user?.id]
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <FeedHeader count={filtered.length} loading={loading} mode={searchMode} />

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
                  onPostulate={() => handlePostulateFromFeed(item.id)}
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
                    iconName="warning-outline"
                    title="Error al cargar"
                    body={error}
                    action="Reintentar"
                    onAction={refresh}
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
                    iconName="warning-outline"
                    title="Error al cargar"
                    body={resourceList.error}
                    action="Reintentar"
                    onAction={resourceList.refresh}
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