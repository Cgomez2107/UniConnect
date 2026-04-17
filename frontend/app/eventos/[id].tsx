/**
 * app/eventos/[id].tsx
 * Pantalla: Ver detalles de un evento (US-008)
 */
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Colors } from "@/constants/Colors"
import { useEventDetailScreen } from "@/hooks/application/useEventDetailScreen"
import type { CampusEvent, EventCategory } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const CATEGORY_ICON: Record<EventCategory, keyof typeof Ionicons.glyphMap> = {
  academico: "school-outline",
  cultural: "color-palette-outline",
  deportivo: "football-outline",
  otro: "bookmark-outline",
}

const CATEGORY_LABEL: Record<EventCategory, string> = {
  academico: "Academico",
  cultural: "Cultural",
  deportivo: "Deportivo",
  otro: "Otro",
}

const CATEGORY_COLOR: Record<EventCategory, string> = {
  academico: "#2563eb",
  cultural: "#a855f7",
  deportivo: "#22c55e",
  otro: "#f59e0b",
}

export default function EventDetail() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { loading, event, formattedDate } = useEventDetailScreen(id)

  const category = event?.category ?? "otro"
  const categoryColor = CATEGORY_COLOR[category]

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
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + "18" }]}> 
            <Ionicons name={CATEGORY_ICON[category]} size={14} color={categoryColor} />
            <Text style={[styles.categoryText, { color: categoryColor }]}>{CATEGORY_LABEL[category]}</Text>
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

          {event.creator?.full_name ? (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={15} color={C.textSecondary} />
              <Text style={[styles.metaText, { color: C.textSecondary }]}>Publicado por {event.creator.full_name}</Text>
            </View>
          ) : null}

          <View style={[styles.descriptionCard, { backgroundColor: C.surface, borderColor: C.border }]}> 
            <Text style={[styles.descriptionTitle, { color: C.textPrimary }]}>Descripcion</Text>
            <Text style={[styles.descriptionBody, { color: C.textSecondary }]}>
              {event.description?.trim() || "Este evento no tiene descripcion adicional."}
            </Text>
          </View>
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
})
