// Pantalla de eventos del campus para estudiantes.

import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Colors } from "@/constants/Colors"
import { useEvents, type EventFilter } from "@/hooks/application/useEvents"
import { Ionicons } from "@expo/vector-icons"
import type { CampusEvent, EventCategory } from "@/types"
import { useEffect, useRef } from "react"
import {
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// Constantes de categoría

const CATEGORY_ICON: Record<EventCategory, keyof typeof Ionicons.glyphMap> = {
  academico: "school-outline",
  cultural: "color-palette-outline",
  deportivo: "football-outline",
  otro: "bookmark-outline",
}
const CATEGORY_COLOR: Record<EventCategory, string> = { academico: "#2563eb", cultural: "#a855f7", deportivo: "#22c55e", otro: "#f59e0b" }
const CATEGORY_LABEL: Record<EventCategory, string> = { academico: "Académico", cultural: "Cultural", deportivo: "Deportivo", otro: "Otro" }

const FILTERS: { key: EventFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "todos", label: "Todos", icon: "apps-outline" },
  { key: "academico", label: "Académico", icon: "school-outline" },
  { key: "cultural", label: "Cultural", icon: "color-palette-outline" },
  { key: "deportivo", label: "Deportivo", icon: "football-outline" },
  { key: "otro", label: "Otro", icon: "bookmark-outline" },
]

// Tarjeta de evento

function EventCard({ item, C }: { item: CampusEvent; C: typeof Colors["light"] }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(14)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start()
  }, [])

  const date      = new Date(item.event_date)
  const day       = date.toLocaleDateString("es-CO", { day: "2-digit" })
  const month     = date.toLocaleDateString("es-CO", { month: "short" }).toUpperCase()
  const time      = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
  const catColor  = CATEGORY_COLOR[item.category] ?? C.primary

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>

        <View style={[styles.dateBlock, { backgroundColor: catColor + "18" }]}>
          <Text style={[styles.dateDay,   { color: catColor }]}>{day}</Text>
          <Text style={[styles.dateMonth, { color: catColor }]}>{month}</Text>
          <Text style={[styles.dateTime,  { color: catColor }]}>{time}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + "18" }]}>
            <View style={styles.categoryInline}>
              <Ionicons name={CATEGORY_ICON[item.category]} size={13} color={catColor} />
              <Text style={[styles.categoryText, { color: catColor }]}>
                {CATEGORY_LABEL[item.category]}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardTitle, { color: C.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>

          {item.description ? (
            <Text style={[styles.cardDesc, { color: C.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {item.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={C.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.cardMeta, { color: C.textSecondary }]}>
                {item.location}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  )
}

// Pantalla principal

export default function EventosScreen() {
  const scheme = useColorScheme() ?? "light"
  const C      = Colors[scheme]
  const insets = useSafeAreaInsets()

  const { filteredEvents, isLoading, isRefreshing, activeFilter, setActiveFilter, refresh } = useEvents()

  return (
    <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top }]}>

      {/* Cabecera */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="calendar-outline" size={20} color={C.textPrimary} />
          <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Eventos del Campus</Text>
        </View>
        <Text style={[styles.headerSub, { color: C.textSecondary }]}>Próximos eventos académicos y culturales</Text>
      </View>

      <View style={[styles.filtersContainer, { borderBottomColor: C.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          bounces={false}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? C.primary : C.surface,
                    borderColor:     active ? C.primary : C.border,
                  },
                ]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.85}
              >
                <View style={styles.filterInline}>
                  <Ionicons name={f.icon} size={14} color={active ? "#fff" : C.textSecondary} />
                  <Text style={[styles.filterText, { color: active ? "#fff" : C.textSecondary }]}>
                    {f.label}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingState message="Cargando eventos..." />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={C.primary}
              colors={[C.primary]}
            />
          }
          renderItem={({ item }) => <EventCard item={item} C={C} />}
          ListEmptyComponent={
            <EmptyState
              emoji="📅"
              iconName="calendar-outline"
              title="No hay eventos próximos"
              body={activeFilter === "todos"
                ? "El administrador aún no ha publicado eventos del campus."
                : `No hay eventos de tipo "${CATEGORY_LABEL[activeFilter as EventCategory] ?? activeFilter}".`
              }
            />
          }
        />
      )}
    </View>
  )
}

// Estilos

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerSub:   { fontSize: 13, marginTop: 2 },

  // Filtros
  filtersContainer: { borderBottomWidth: 1 },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  filterInline: { flexDirection: "row", alignItems: "center", gap: 6 },

  // Lista
  list: { padding: 16, gap: 12 },

  // Tarjeta
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },

  // Bloque de fecha lateral
  dateBlock: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 2,
  },
  dateDay:   { fontSize: 24, fontWeight: "800", lineHeight: 28 },
  dateMonth: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  dateTime:  { fontSize: 10, fontWeight: "500", marginTop: 4 },

  // Cuerpo de la tarjeta
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: { fontSize: 11, fontWeight: "700" },
  categoryInline: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardTitle:    { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  cardDesc:     { fontSize: 13, lineHeight: 18 },
  locationRow:  { flexDirection: "row", alignItems: "center" },
  cardMeta:     { fontSize: 12 },
})
