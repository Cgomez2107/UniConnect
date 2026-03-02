/**
 * app/(tabs)/feed.tsx
 *
 * Pantalla del feed - US-006.
 * Esta pantalla es un ORQUESTADOR puro: solo conecta el hook useFeed
 * con los componentes visuales. Sin logica de datos, sin estilos masivos.
 *
 * Logica de datos  -> hooks/useFeed.ts
 * Componentes      -> components/feed/
 * Componentes UI   -> components/shared/
 */

import { FeedFilterModal } from "@/components/feed/FeedFilterModal";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { ModalityChips } from "@/components/feed/ModalityChips";
import { SearchBar } from "@/components/feed/SearchBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { CardSolicitud } from "@/components/ui/CardSolicitud";
import { Colors } from "@/constants/Colors";
import { useFeed } from "@/hooks/useFeed";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FeedScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [showFilters, setShowFilters] = useState(false);

  const {
    filtered,
    faculties,
    loading,
    refreshing,
    error,
    search,
    setSearch,
    selectedFaculty,
    setSelectedFaculty,
    selectedModality,
    setSelectedModality,
    activeFilters,
    refresh,
  } = useFeed();

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <FeedHeader count={filtered.length} loading={loading} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
        activeFilters={activeFilters}
        onOpenFilters={() => setShowFilters(true)}
      />

      <ModalityChips selected={selectedModality} onSelect={setSelectedModality} />

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
                emoji="Warning"
                title="Error al cargar"
                body={error}
                action="Reintentar"
                onAction={refresh}
              />
            ) : (
              <EmptyState
                emoji="Search"
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
        selectedFaculty={selectedFaculty}
        onSelectFaculty={setSelectedFaculty}
        faculties={faculties}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});