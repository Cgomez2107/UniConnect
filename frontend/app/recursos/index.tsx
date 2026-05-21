/**
 * app/recursos/index.tsx
 *
 * Pantalla: Biblioteca de recursos (US-V03)
 * - Lista en rejilla de recursos con soporte para Open Graph
 * - Filtro por materia y tipo de contenido
 * - Badges de decoradores (etiquetas, valoración, comentarios)
 * - Permisos: editar solo si owner o admin
 */

import { Colors } from "@/constants/Colors"
import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import { router, useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { StudyResource } from "@/types"

const CONTENT_TYPES = ["todos", "pdf", "document", "video", "link", "image"] as const
type ContentType = (typeof CONTENT_TYPES)[number]

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  todos: "Todos",
  pdf: "PDF",
  document: "Documento",
  video: "Video",
  link: "Enlace",
  image: "Imagen",
}

function getFileIcon(fileType: string | null): string {
  if (!fileType) return "📎"
  if (fileType.includes("pdf")) return "📄"
  if (fileType.includes("image")) return "🖼️"
  if (fileType.includes("video")) return "🎬"
  if (fileType.includes("link")) return "🔗"
  return "📎"
}

export default function ResourcesList() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)

  const [resources, setResources] = useState<StudyResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<ContentType>("todos")

  const loadResources = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const container = DIContainer.getInstance()
      const useCase = container.getGetStudyResourcesBySubject()
      const result = await useCase.execute("")
      setResources(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar recursos")
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadResources()
    }, [loadResources]),
  )

  const filteredResources = resources.filter((r) => {
    if (activeType === "todos") return true
    const fileType = (r.file_type || "").toLowerCase()
    return fileType.includes(activeType)
  })

  const isOwner = (resource: StudyResource) => {
    return user?.id === resource.user_id || user?.role === "admin"
  }

  const renderResource = ({ item }: { item: StudyResource }) => {
    const hasOgImage = !!item.og_image
    const icon = getFileIcon(item.file_type)

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={() => router.push(`/recurso/${item.id}`)}
        activeOpacity={0.85}
      >
        {hasOgImage && (
          <Image
            source={{ uri: item.og_image! }}
            style={styles.ogImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            {!hasOgImage && <Text style={styles.cardIcon}>{icon}</Text>}
            <View style={styles.cardTitleArea}>
              <Text style={[styles.cardTitle, { color: C.textPrimary }]} numberOfLines={2}>
                {item.og_title || item.title}
              </Text>
              {item.subjects?.name && (
                <Text style={[styles.cardSubject, { color: C.textSecondary }]} numberOfLines={1}>
                  {item.subjects.name}
                </Text>
              )}
            </View>
          </View>

          {(item.description || item.og_description) && (
            <Text style={[styles.cardDesc, { color: C.textSecondary }]} numberOfLines={2}>
              {item.og_description || item.description}
            </Text>
          )}

          <View style={styles.badges}>
            <View style={[styles.typeBadge, { backgroundColor: C.primary + "15" }]}>
              <Text style={[styles.typeBadgeText, { color: C.primary }]}>
                {(item.file_type || "?").toUpperCase()}
              </Text>
            </View>
            {item.og_image && (
              <Text style={styles.decoratorIcon}>🖼️</Text>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={[styles.uploader, { color: C.textSecondary }]} numberOfLines={1}>
              👤 {item.profiles?.full_name || "Anónimo"}
            </Text>
            {isOwner(item) && (
              <View style={[styles.ownerBadge, { borderColor: C.accent }]}>
                <Text style={[styles.ownerBadgeText, { color: C.accent }]}>Tuyo</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Biblioteca</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: C.primary }]}
          onPress={() => router.push("/subir-recurso")}
        >
          <Text style={[styles.uploadBtnText, { color: C.textOnPrimary }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Type filter */}
      <View style={styles.filterRow}>
        {CONTENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeType === type ? C.primary : C.surface,
                borderColor: activeType === type ? C.primary : C.border,
              },
            ]}
            onPress={() => setActiveType(type)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeType === type ? C.textOnPrimary : C.textSecondary },
              ]}
            >
              {CONTENT_TYPE_LABELS[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: C.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: C.primary }]} onPress={loadResources}>
            <Text style={[styles.retryBtnText, { color: C.textOnPrimary }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredResources}
          renderItem={renderResource}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📂</Text>
              <Text style={[styles.emptyText, { color: C.textSecondary }]}>
                {activeType !== "todos"
                  ? "No hay recursos de este tipo"
                  : "No hay recursos disponibles"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { fontSize: 14, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 22, fontWeight: "700" },
  uploadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnText: { fontSize: 22, fontWeight: "700", lineHeight: 24 },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 11, fontWeight: "600" },

  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: { gap: 10 },

  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  ogImage: { width: "100%", height: 90 },
  cardBody: { padding: 10 },
  cardHeader: { flexDirection: "row", gap: 6, marginBottom: 4 },
  cardIcon: { fontSize: 20 },
  cardTitleArea: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: "600", lineHeight: 17 },
  cardSubject: { fontSize: 11, marginTop: 1 },
  cardDesc: { fontSize: 11, lineHeight: 15, marginBottom: 6 },

  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 6,
    alignItems: "center",
  },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 9, fontWeight: "700" },
  decoratorIcon: { fontSize: 14 },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uploader: { fontSize: 10, flex: 1 },
  ownerBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ownerBadgeText: { fontSize: 9, fontWeight: "600" },
})
