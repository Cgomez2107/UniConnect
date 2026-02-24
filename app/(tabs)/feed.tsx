/**
 * app/(tabs)/feed.tsx
 * Feed corregido — bugs visuales resueltos:
 * 1. SafeAreaView reemplazado por useSafeAreaInsets (funciona en Android)
 * 2. Chips de modalidad con altura fija (no colapsan)
 * 3. Padding bottom correcto para la lista
 */

import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardSolicitud } from "@/components/ui/CardSolicitud";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/useAuthStore";
import { MOCK_FACULTIES, MOCK_REQUESTS } from "@/utils/mockData";

const MODALITIES = ["Todos", "presencial", "virtual", "híbrido"];

export default function FeedScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets(); // ✅ insets reales del dispositivo

  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedModality, setSelectedModality] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_REQUESTS.filter((r) => {
      const matchSearch =
        search.trim() === "" ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.subject_name.toLowerCase().includes(search.toLowerCase());
      const matchFaculty = !selectedFaculty || r.faculty_name === selectedFaculty;
      const matchModality = selectedModality === "Todos" || r.modality === selectedModality;
      return matchSearch && matchFaculty && matchModality;
    });
  }, [search, selectedFaculty, selectedModality]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };

  const activeFilters =
    (selectedFaculty ? 1 : 0) + (selectedModality !== "Todos" ? 1 : 0);

  return (
    // ✅ View normal con paddingTop del inset (no SafeAreaView)
    <View style={[styles.container, {
      backgroundColor: C.background,
      paddingTop: insets.top, // respeta la status bar real
    }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: C.textPrimary }]}>
            Solicitudes
          </Text>
          <Text style={[styles.headerSub, { color: C.textSecondary }]}>
            {filtered.length} publicaciones activas
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: C.accent }]}
          onPress={() => router.push("/nueva-solicitud")}
          activeOpacity={0.85}
        >
          <Text style={[styles.newBtnText, { color: C.primary }]}>
            + Nueva
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Buscador + botón filtros ─────────────────────────────────────── */}
      <View style={[styles.searchRow, { borderBottomColor: C.border }]}>
        <View style={[styles.searchBox, {
          backgroundColor: C.surface,
          borderColor: C.border,
        }]}>
          <Text style={{ color: C.textPlaceholder, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: C.textPrimary }]}
            placeholder="Buscar por materia o título..."
            placeholderTextColor={C.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: C.textSecondary, fontSize: 18, lineHeight: 20 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, {
            backgroundColor: activeFilters > 0 ? C.primary : C.surface,
            borderColor: C.border,
          }]}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 16 }}>⚙️</Text>
          {activeFilters > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: C.accent }]}>
              <Text style={[styles.filterBadgeText, { color: C.primary }]}>
                {activeFilters}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Chips de modalidad ───────────────────────────────────────────── */}
      {/* ✅ height fija + flexShrink:0 evita que colapse */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {MODALITIES.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, {
                backgroundColor: selectedModality === m ? C.primary : C.surface,
                borderColor: selectedModality === m ? C.primary : C.border,
              }]}
              onPress={() => setSelectedModality(m)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, {
                color: selectedModality === m ? C.textOnPrimary : C.textSecondary,
              }]}>
                {m === "Todos" ? "Todos" : m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Lista de solicitudes ─────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardSolicitud
            item={item}
            isOwnPost={item.author_id === user?.id}
            onPress={(r) => router.push(`/solicitud/${r.id}`)}
            onPostulate={(r) => router.push(`/postular/${r.id}`)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 }, // ✅ espacio para tab bar + home indicator
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
              Sin resultados
            </Text>
            <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
              Intenta con otros filtros o crea la primera solicitud.
            </Text>
          </View>
        }
      />

      {/* ── Modal de filtros ─────────────────────────────────────────────── */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        selectedFaculty={selectedFaculty}
        onSelectFaculty={setSelectedFaculty}
        C={C}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

// ── Modal de filtros ──────────────────────────────────────────────────────────
function FilterModal({
  visible, onClose, selectedFaculty, onSelectFaculty, C, bottomInset,
}: {
  visible: boolean;
  onClose: () => void;
  selectedFaculty: string | null;
  onSelectFaculty: (f: string | null) => void;
  C: (typeof Colors)["light"];
  bottomInset: number;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View
          style={[styles.modalSheet, {
            backgroundColor: C.surface,
            paddingBottom: bottomInset + 24, // ✅ respeta home indicator
          }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.modalHandle, { backgroundColor: C.border }]} />
          <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
            Filtrar por Facultad
          </Text>

          <TouchableOpacity
            style={[styles.facultyOption, {
              backgroundColor: !selectedFaculty ? C.primary + "15" : "transparent",
              borderColor: !selectedFaculty ? C.primary : C.border,
            }]}
            onPress={() => { onSelectFaculty(null); onClose(); }}
          >
            <Text style={[styles.facultyOptionText, {
              color: !selectedFaculty ? C.primary : C.textPrimary,
            }]}>
              Todas las facultades
            </Text>
          </TouchableOpacity>

          {MOCK_FACULTIES.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.facultyOption, {
                backgroundColor: selectedFaculty === f.name ? C.primary + "15" : "transparent",
                borderColor: selectedFaculty === f.name ? C.primary : C.border,
              }]}
              onPress={() => { onSelectFaculty(f.name); onClose(); }}
            >
              <Text style={[styles.facultyOptionText, {
                color: selectedFaculty === f.name ? C.primary : C.textPrimary,
              }]}>
                {f.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, marginTop: 2 },
  newBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  newBtnText: { fontSize: 14, fontWeight: "700" },

  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { fontSize: 10, fontWeight: "700" },

  // ✅ Wrapper con altura fija — garantiza que los chips siempre se vean
  chipsWrapper: {
    height: 52,
    flexShrink: 0,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 13, fontWeight: "500" },

  listContent: { paddingTop: 8 },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000050",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", marginBottom: 16 },
  facultyOption: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  facultyOptionText: { fontSize: 14, fontWeight: "500" },
});