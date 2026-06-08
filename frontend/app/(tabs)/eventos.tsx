// Pantalla de eventos del campus para estudiantes.

import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Colors } from "@/constants/Colors"
import { useEventCategories } from "@/hooks/useEventCategories"
import { useEventObserver } from "@/hooks/application/useEventObserver"
import { useEvents, type EventFilter } from "@/hooks/application/useEvents"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { CampusEvent, EventCategoryRow } from "@/types"
import { router } from "expo-router"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
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

const SUBSCRIPTIONS_KEY = "uniconnect-event-subscriptions"

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  academico: "school-outline",
  cultural: "color-palette-outline",
  deportivo: "football-outline",
  otro: "bookmark-outline",
}
const CATEGORY_COLORS: Record<string, string> = { academico: "#2563eb", cultural: "#a855f7", deportivo: "#22c55e", otro: "#f59e0b" }
const CATEGORY_LABELS: Record<string, string> = { academico: "Académico", cultural: "Cultural", deportivo: "Deportivo", otro: "Otro" }

function categoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[slug] ?? "bookmark-outline"
}
function categoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? "#6b7280"
}
function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? (slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "))
}

// Tarjeta de evento

const EventCard = memo(function EventCard({ item, C, onOpen }: { item: CampusEvent; C: typeof Colors["light"]; onOpen: (eventId: string) => void }) {
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
  const catColor  = categoryColor(item.category)

  const handleOpen = useCallback(() => {
    onOpen(item.id)
  }, [onOpen, item.id])

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
        activeOpacity={0.9}
        onPress={handleOpen}
      >

        <View style={[styles.dateBlock, { backgroundColor: catColor + "18" }]}>
          <Text style={[styles.dateDay,   { color: catColor }]}>{day}</Text>
          <Text style={[styles.dateMonth, { color: catColor }]}>{month}</Text>
          <Text style={[styles.dateTime,  { color: catColor }]}>{time}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + "18" }]}>
            <View style={styles.categoryInline}>
              <Ionicons name={categoryIcon(item.category)} size={13} color={catColor} />
              <Text style={[styles.categoryText, { color: catColor }]}>
                {categoryLabel(item.category)}
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
      </TouchableOpacity>
    </Animated.View>
  )
})

// Pantalla principal

export default function EventosScreen() {
  const scheme = useColorScheme() ?? "light"
  const C      = Colors[scheme]
  const insets = useSafeAreaInsets()

  const { filteredEvents, isLoading, isRefreshing, activeFilter, setActiveFilter, refresh } = useEvents()
  const { categories: dbCategories } = useEventCategories()

  // Build dynamic filters from DB categories + "todos" + "pasados"
  const filters = useMemo(() => {
    const staticFilters: { key: EventFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { key: "todos", label: "Todos", icon: "apps-outline" },
    ]
    for (const cat of dbCategories) {
      staticFilters.push({
        key: cat.id as EventFilter,
        label: cat.name,
        icon: categoryIcon(cat.slug),
      })
    }
    staticFilters.push({ key: "pasados", label: "Pasados", icon: "time-outline" })
    return staticFilters
  }, [dbCategories])

  // ── Suscripciones a categorías (persistidas localmente) ──────────
  const [subscribedCategories, setSubscribedCategories] = useState<string[]>([])

  useEffect(() => {
    AsyncStorage.getItem(SUBSCRIPTIONS_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) setSubscribedCategories(parsed)
        } catch { /* ignore */ }
      }
    })
  }, [])

  const persistSubscriptions = useCallback((categories: string[]) => {
    setSubscribedCategories(categories)
    AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(categories))
  }, [])

  const toggleSubscription = useCallback(
    (categoryId: string) => {
      persistSubscriptions(
        subscribedCategories.includes(categoryId)
          ? subscribedCategories.filter((c) => c !== categoryId)
          : [...subscribedCategories, categoryId],
      )
    },
    [subscribedCategories, persistSubscriptions],
  )

  // Observador de nuevos eventos en categorías suscritas
  useEventObserver(subscribedCategories)

  const keyExtractor = useCallback((item: CampusEvent) => item.id, [])

  const openEvent = useCallback((eventId: string) => {
    router.push(`/eventos/${eventId}` as any)
  }, [])

  const renderEventItem = useCallback(
    ({ item }: { item: CampusEvent }) => <EventCard item={item} C={C} onOpen={openEvent} />, 
    [C, openEvent],
  )

  const handleSetFilter = useCallback(
    (filter: EventFilter) => {
      setActiveFilter(filter)
    },
    [setActiveFilter],
  )

  const emptyTitle = activeFilter === "pasados" ? "No hay eventos pasados" : "No hay eventos próximos"

  const emptyBody = useMemo(() => {
    if (activeFilter === "todos") {
      return "El administrador aún no ha publicado eventos del campus."
    }

    if (activeFilter === "pasados") {
      return "No se han registrado eventos en el pasado."
    }

    const catName = dbCategories.find((c) => c.id === activeFilter)?.name ?? categoryLabel(activeFilter)
    return `No hay eventos de tipo "${catName}".`
  }, [activeFilter, dbCategories])

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
          {filters.map((f) => {
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
                onPress={() => handleSetFilter(f.key)}
                onLongPress={() => {
                  if (f.key !== "todos" && f.key !== "pasados") {
                    toggleSubscription(f.key)
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={styles.filterInline}>
                  <Ionicons name={f.icon} size={14} color={active ? "#fff" : C.textSecondary} />
                  <Text style={[styles.filterText, { color: active ? "#fff" : C.textSecondary }]}>
                    {f.label}
                  </Text>
                  {f.key !== "todos" && f.key !== "pasados" && (
                    <Ionicons
                      name={subscribedCategories.includes(f.key) ? "notifications" : "notifications-off-outline"}
                      size={12}
                      color={active ? "rgba(255,255,255,0.7)" : C.textSecondary}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
        <Text style={[styles.subHint, { color: C.textSecondary }]}>
          Mantén presionada una categoría para suscribirte y recibir notificaciones
        </Text>
      </View>

      {isLoading ? (
        <LoadingState message="Cargando eventos..." />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={keyExtractor}
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
          renderItem={renderEventItem}
          ListEmptyComponent={
            <EmptyState
              emoji="📅"
              iconName="calendar-outline"
              title={emptyTitle}
              body={emptyBody}
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
  subHint: {
    fontSize: 10,
    textAlign: "center",
    paddingBottom: 6,
    paddingHorizontal: 16,
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
