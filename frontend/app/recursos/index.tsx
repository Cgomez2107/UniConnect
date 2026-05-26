import { Colors } from "@/constants/Colors"
import { useResources } from "@/hooks/application/useResources"
import { useAuthStore } from "@/store/useAuthStore"
import { router } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const TYPE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "pdf", label: "PDF" },
  { value: "document", label: "Documentos" },
  { value: "video", label: "Videos" },
  { value: "link", label: "Enlaces" },
  { value: "image", label: "Imágenes" },
]

const FILE_ICONS: Record<string, string> = {
  PDF: "📄",
  DOCX: "📝",
  DOC: "📝",
  XLSX: "📊",
  XLS: "📊",
  PPTX: "📽️",
  PPT: "📽️",
  TXT: "📃",
  JPG: "🖼️",
  JPEG: "🖼️",
  PNG: "🖼️",
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}sem`
}

export default function ResourcesListScreen() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s: any) => s.user)
  const { data: resources, loading, error, listResources } = useResources()
  const [selectedType, setSelectedType] = useState("")
  const [activeTab, setActiveTab] = useState<"todos" | "mis-recursos">("todos")

  useEffect(() => {
    listResources({
      type: selectedType || undefined,
    })
  }, [selectedType])

  const filteredResources = useMemo(() => {
    let items = resources || []
    if (activeTab === "mis-recursos" && user?.id) {
      items = items.filter((r) => r.user_id === user.id)
    }
    return items
  }, [resources, activeTab, user?.id])

  const handleOpenResource = useCallback((item: any) => {
    router.push(`/recurso/${item.id}`)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const fileType = (item.resource_type ?? item.file_type ?? "").toUpperCase()
      const icon = FILE_ICONS[fileType] ?? (item.resource_type === "link" ? "🔗" : "📎")
      const authorName = item.profiles?.full_name ?? "Estudiante"
      const subjectName = item.subjects?.name ?? ""

      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={() => handleOpenResource(item)}
          activeOpacity={0.92}
        >
          {/* Open Graph preview */}
          {item.resource_type === "link" && item.og_image && (
            <View style={styles.ogPreview}>
              <Text style={styles.ogPlaceholder}>🔗 Vista previa del enlace</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: C.primary + "15" }]}>
              <Text style={styles.iconText}>{icon}</Text>
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={[styles.cardTitle, { color: C.textPrimary }]} numberOfLines={2}>
                {item.title}
              </Text>
              {item.og_title && item.resource_type === "link" && item.og_title !== item.title && (
                <Text style={[styles.ogTitle, { color: C.textSecondary }]} numberOfLines={1}>
                  {item.og_title}
                </Text>
              )}
            </View>
          </View>

          {subjectName ? (
            <View style={[styles.subjectTag, { backgroundColor: C.primary + "12" }]}>
              <Text style={[styles.subjectText, { color: C.primary }]}>{subjectName}</Text>
            </View>
          ) : null}

          <View style={styles.cardFooter}>
            <Text style={[styles.meta, { color: C.textSecondary }]}>
              {authorName} · {getTimeAgo(item.created_at)}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: C.border }]}>
              <Text style={[styles.typeText, { color: C.textSecondary }]}>
                {(item.resource_type ?? fileType) || "?"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [C, handleOpenResource]
  )

  return (
    <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Biblioteca de Recursos</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: C.primary }]}
          onPress={() => router.push("/subir-recurso")}
          activeOpacity={0.85}
        >
          <Text style={[styles.uploadBtnText, { color: C.textOnPrimary }]}>+ Subir</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: C.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "todos" && { borderBottomColor: C.primary }]}
          onPress={() => setActiveTab("todos")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "todos" ? C.primary : C.textSecondary },
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "mis-recursos" && { borderBottomColor: C.primary }]}
          onPress={() => setActiveTab("mis-recursos")}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "mis-recursos" ? C.primary : C.textSecondary },
            ]}
          >
            Mis recursos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Type filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TYPE_FILTERS}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedType === item.value ? C.primary : C.surface,
                borderColor: selectedType === item.value ? C.primary : C.border,
              },
            ]}
            onPress={() => setSelectedType(item.value)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: selectedType === item.value ? C.textOnPrimary : C.textPrimary },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>
            Cargando recursos…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: C.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: C.primary }]}
            onPress={() => listResources({ type: selectedType || undefined })}
          >
            <Text style={[styles.retryText, { color: C.textOnPrimary }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredResources}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                {selectedType
                  ? `No hay recursos de tipo "${TYPE_FILTERS.find((t) => t.value === selectedType)?.label}"`
                  : activeTab === "mis-recursos"
                    ? "No has subido recursos todavía"
                    : "No hay recursos disponibles"}
              </Text>
              <TouchableOpacity
                style={[styles.uploadBtn, { backgroundColor: C.primary }]}
                onPress={() => router.push("/subir-recurso")}
              >
                <Text style={[styles.uploadBtnText, { color: C.textOnPrimary }]}>
                  Subir el primer recurso
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 22, fontWeight: "700" },
  uploadBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadBtnText: { fontSize: 14, fontWeight: "600" },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  tabText: { fontSize: 14, fontWeight: "600" },
  filterList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: "500" },
  list: { padding: 20, paddingBottom: 40 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  ogPreview: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  ogPlaceholder: { fontSize: 13, textAlign: "center" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 22 },
  cardHeaderInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  ogTitle: { fontSize: 12, lineHeight: 16 },
  subjectTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectText: { fontSize: 12, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  meta: { fontSize: 12 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeText: { fontSize: 11, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  retryText: { fontSize: 14, fontWeight: "600" },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
})
