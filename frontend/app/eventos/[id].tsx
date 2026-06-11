import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Colors } from "@/constants/Colors"
import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import { useEventDetailScreen } from "@/hooks/application/useEventDetailScreen"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useCallback, useState } from "react"
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  cancelled: "Cancelado",
  finished: "Finalizado",
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#f59e0b",
  published: "#22c55e",
  cancelled: "#ef4444",
  finished: "#6b7280",
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  academico: "school-outline",
  cultural: "color-palette-outline",
  deportivo: "football-outline",
  otro: "bookmark-outline",
}

const CATEGORY_LABELS: Record<string, string> = {
  academico: "Académico",
  cultural: "Cultural",
  deportivo: "Deportivo",
  otro: "Otro",
}

const CATEGORY_COLORS: Record<string, string> = {
  academico: "#2563eb",
  cultural: "#a855f7",
  deportivo: "#22c55e",
  otro: "#f59e0b",
}

function categoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[slug] ?? "bookmark-outline"
}
function categoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? "#6b7280"
}
function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "))
}

export default function EventDetail() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { loading, event, formattedDate, refreshEvent } = useEventDetailScreen(id)
  const userId = useAuthStore((s) => s.user?.id)

  const [justRegistered, setJustRegistered] = useState<boolean | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const isRegistered = justRegistered !== null ? justRegistered : (event?.isRegistered === true)

  const categorySlug = event?.category ?? "otro"
  const catColor = categoryColor(categorySlug)
  const status = event?.status ?? "published"
  const statusColor = STATUS_COLORS[status] ?? "#6b7280"
  const isOwner = !!userId && !!event?.created_by && userId === event.created_by

  const handlePublish = useCallback(async () => {
    if (!id) return
    try {
      const repo = DIContainer.getInstance().getEventRepository()
      await repo.publish(id)
      Alert.alert("Evento publicado", "Tu evento ahora es visible para todos.", [
        { text: "OK", onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo publicar el evento")
    }
  }, [id])

  const handleCancel = useCallback(async () => {
    if (!id) return
    Alert.alert(
      "Cancelar evento",
      "¿Seguro que quieres cancelar este evento?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar", style: "destructive",
          onPress: async () => {
            try {
              const repo = DIContainer.getInstance().getEventRepository()
              await repo.cancel(id)
              Alert.alert("Evento cancelado", "El evento ha sido cancelado.", [
                { text: "OK", onPress: () => router.back() },
              ])
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo cancelar el evento")
            }
          },
        },
      ]
    )
  }, [id])

  const handleEdit = useCallback(() => {
    if (id) router.push(`/editar-evento/${id}` as any)
  }, [id])

  const handleRegister = useCallback(async () => {
    if (!id || !userId || isActionLoading) return
    setIsActionLoading(true)
    try {
      const repo = DIContainer.getInstance().getEventRepository()
      await repo.registerForEvent(id, userId)
      setJustRegistered(true)
      await refreshEvent()  // refresca capacity en pantalla
      Alert.alert("Inscripción exitosa", "Te has inscrito al evento.")
    } catch (e: any) {
      const isConcurrencyFull = e?.status === 409 || e?.response?.status === 409 || e?.message?.includes("Cupo agotado") || e?.message?.includes("Ya estás inscrito");
      if (isConcurrencyFull) {
        await refreshEvent()  // muestra cupo actualizado aunque fallara
        Alert.alert("Cupo agotado", "Lo sentimos, el cupo para este evento se agotó justo antes de completar tu registro.")
      } else {
        Alert.alert("Error", e?.message ?? "No se pudo completar la inscripción")
      }
    } finally {
      setIsActionLoading(false)
    }
  }, [id, userId, isActionLoading, refreshEvent])

  const confirmUnregister = useCallback(async () => {
    if (!id || !userId) return
    setIsActionLoading(true)
    try {
      const repo = DIContainer.getInstance().getEventRepository()
      await repo.unregisterFromEvent(id, userId)
      setJustRegistered(false)
      await refreshEvent()  // refresca capacity en pantalla
      Alert.alert("Éxito", "Has cancelado tu inscripción exitosamente. Tu cupo ha sido liberado.")
    } catch (e: any) {
      const isPolicyViolation = e?.status === 400 || e?.response?.status === 400 || e?.message?.includes("Política de cancelación");
      if (isPolicyViolation) {
        Alert.alert("Política de cancelación", "No se permiten cancelaciones a menos de 24 horas del evento. Contacta al organizador.");
      } else {
        Alert.alert("Error", e?.message ?? "No se pudo cancelar la inscripción")
      }
    } finally {
      setIsActionLoading(false)
    }
  }, [id, userId, refreshEvent])

  const handleUnregister = useCallback(() => {
    if (!id || !userId || isActionLoading) return
    Alert.alert(
      "Cancelar inscripción",
      "¿Estás seguro de que deseas liberar tu cupo para este evento?",
      [
        { text: "No", style: "cancel" },
        { text: "Sí, cancelar", style: "destructive", onPress: confirmUnregister },
      ]
    )
  }, [id, userId, isActionLoading, confirmUnregister])

  return (
    <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Detalle del evento</Text>
      </View>

      {loading ? (
        <LoadingState message="Cargando evento..." />
      ) : !event ? (
        <EmptyState
          emoji="📅"
          iconName="calendar-outline"
          title="Evento no encontrado"
          body="El evento no existe o fue eliminado."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Status badge */}
          <View style={styles.topRow}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor + "18" }]}>
              <Ionicons name={categoryIcon(categorySlug)} size={14} color={catColor} />
              <Text style={[styles.categoryText, { color: catColor }]}>{categoryLabel(categorySlug)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[status] ?? status}
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: C.textPrimary }]}>{event.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={15} color={C.textSecondary} />
            <Text style={[styles.metaText, { color: C.textSecondary }]}>{formattedDate}</Text>
          </View>

          {event.location ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={15} color={C.textSecondary} />
              <Text style={[styles.metaText, { color: C.textSecondary }]}>{event.location}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={15} color={C.textSecondary} />
            <Text style={[styles.metaText, { color: C.textSecondary }]}>
              {event.capacity != null
                ? `Cupos disponibles: ${Math.max(0, event.capacity - (event.registered_count ?? 0))} / ${event.capacity}`
                : "Cupos: Ilimitados"}
            </Text>
          </View>

          {event.creator?.full_name ? (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={15} color={C.textSecondary} />
              <Text style={[styles.metaText, { color: C.textSecondary }]}>
                {isOwner ? "Creado por ti" : `Publicado por ${event.creator.full_name}`}
              </Text>
            </View>
          ) : null}

          <View style={[styles.descriptionCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.descriptionTitle, { color: C.textPrimary }]}>Descripción</Text>
            <Text style={[styles.descriptionBody, { color: C.textSecondary }]}>
              {event.description?.trim() || "Este evento no tiene descripción adicional."}
            </Text>
          </View>

          {/* Owner controls */}
          {isOwner && status === "draft" && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={[styles.ownerBtn, { backgroundColor: C.primary }]}
                onPress={handleEdit}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.ownerBtnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ownerBtn, { backgroundColor: "#22c55e" }]}
                onPress={handlePublish}
                activeOpacity={0.85}
              >
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                <Text style={styles.ownerBtnText}>Publicar</Text>
              </TouchableOpacity>
            </View>
          )}

          {isOwner && status === "published" && (
            <TouchableOpacity
              style={[styles.ownerBtn, { backgroundColor: "#ef4444" }]}
              onPress={handleCancel}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.ownerBtnText}>Cancelar evento</Text>
            </TouchableOpacity>
          )}

          {/* Register / Already registered button for non-owners */}
          {!isOwner && status === "published" && !isRegistered && (
            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: event.isFull ? "#9ca3af" : C.primary }]}
              onPress={handleRegister}
              disabled={isActionLoading || event.isFull}
              activeOpacity={0.85}
            >
              <Ionicons name={event.isFull ? "close-circle-outline" : "checkmark-circle-outline"} size={20} color="#fff" />
              <Text style={styles.registerBtnText}>
                {event.isFull ? "Cupo agotado" : isActionLoading ? "Registrando..." : "Registrarse al evento"}
              </Text>
            </TouchableOpacity>
          )}
          {!isOwner && status === "published" && isRegistered && (
            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: "#ef4444" }]}
              onPress={handleUnregister}
              disabled={isActionLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={20} color="#fff" />
              <Text style={styles.registerBtnText}>
                {isActionLoading ? "Cancelando..." : "Cancelar inscripción"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, gap: 10 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryText: { fontSize: 12, fontWeight: "700" },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "800", lineHeight: 30, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  metaText: { fontSize: 14 },
  descriptionCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  descriptionTitle: { fontSize: 15, fontWeight: "700" },
  descriptionBody: { fontSize: 14, lineHeight: 20 },
  ownerActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  ownerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ownerBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  registerBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
})
