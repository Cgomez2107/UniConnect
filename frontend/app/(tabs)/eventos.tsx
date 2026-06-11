import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Colors } from "@/constants/Colors"
import { useEventCategories } from "@/hooks/useEventCategories"
import { useEventObserver } from "@/hooks/application/useEventObserver"
import { useEvents } from "@/hooks/application/useEvents"
import { useAuthStore } from "@/store/useAuthStore"
import { DIContainer } from "@/lib/services/di/container"
import type { CampusEvent, EventCategoryRow } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { router } from "expo-router"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const SUBSCRIPTIONS_KEY = "uniconnect-event-subscriptions"

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

function renderHighlighted(text: string | null | undefined, term: string | undefined, baseStyle: any, highlightStyle: any): React.ReactNode {
  if (!text || !term) return text
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escaped})`, "gi"))
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase()
      ? <Text key={i} style={[baseStyle, highlightStyle]}>{part}</Text>
      : <Text key={i} style={baseStyle}>{part}</Text>,
  )
}

const EventCard = memo(function EventCard({
  item, C, onOpen, highlight
}: {
  item: CampusEvent; C: typeof Colors["light"]; onOpen: (eventId: string) => void; highlight?: string;
}) {
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
  const status    = item.status ?? "published"
  const statusBg  = STATUS_COLORS[status] ?? "#6b7280"
  const full      = item.isFull === true

  const handleOpen = useCallback(() => { onOpen(item.id) }, [onOpen, item.id])

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
          <View style={styles.topRow}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor + "18" }]}>
              <View style={styles.categoryInline}>
                <Ionicons name={categoryIcon(item.category)} size={13} color={catColor} />
                <Text style={[styles.categoryText, { color: catColor }]}>
                  {categoryLabel(item.category)}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg + "20" }]}>
              <Text style={[styles.statusText, { color: statusBg }]}>
                {STATUS_LABELS[status] ?? status}
              </Text>
            </View>
            {full && (
              <View style={styles.fullBadge}>
                <Text style={styles.fullBadgeText}>Cupo agotado</Text>
              </View>
            )}
          </View>

          <Text style={[styles.cardTitle, { color: C.textPrimary }]} numberOfLines={2}>
            {renderHighlighted(item.title, highlight, {}, { backgroundColor: "#fef08a", color: "#1a1a1a" })}
          </Text>

          {item.description ? (
            <Text style={[styles.cardDesc, { color: C.textSecondary }]} numberOfLines={2}>
              {renderHighlighted(item.description, highlight, {}, { backgroundColor: "#fef08a", color: C.textSecondary })}
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

type TabMode = "campus" | "mis-eventos"

export default function EventosScreen() {
  const scheme = useColorScheme() ?? "light"
  const C      = Colors[scheme]
  const insets = useSafeAreaInsets()
  const userId = useAuthStore((s) => s.user?.id)
  const userRole = useAuthStore((s) => s.user?.role)

  const [tabMode, setTabMode] = useState<TabMode>("campus")
  const { events, meta, isLoading, isRefreshing, page, search, debouncedSearch, selectedCategories, selectedStatus, setSearch, goToPage, toggleCategory, clearCategories, setStatus, refresh } = useEvents()

  const isAdmin = userRole === "admin"
  const { categories: dbCategories } = useEventCategories()
  const [myEvents, setMyEvents] = useState<CampusEvent[]>([])
  const [myEventsLoading, setMyEventsLoading] = useState(false)
  const [myEventsRefreshing, setMyEventsRefreshing] = useState(false)

  const loadMyEvents = useCallback(async (isRefresh = false) => {
    if (!userId) return
    if (isRefresh) setMyEventsRefreshing(true)
    else setMyEventsLoading(true)
    try {
      const repo = DIContainer.getInstance().getEventRepository()
      const data = await repo.getByAuthor(userId)
      setMyEvents(data ?? [])
    } catch (e) {
      console.warn("[EventosScreen] Error loading my events:", e)
    } finally {
      setMyEventsLoading(false)
      setMyEventsRefreshing(false)
    }
  }, [userId])

  useEffect(() => {
    if (tabMode === "mis-eventos" && userId) {
      loadMyEvents()
    }
  }, [tabMode, userId, loadMyEvents])

  // Reset status filter if student somehow had "finished" selected
  useEffect(() => {
    if (!isAdmin && selectedStatus === "finished") {
      setStatus("published")
    }
  }, [isAdmin, selectedStatus, setStatus])

  // Build dynamic filter slugs from DB categories
  const categorySlugs = useMemo(() => {
    return dbCategories.map((c) => c.slug)
  }, [dbCategories])

  const toggleCategoryFilter = useCallback((slug: string) => {
    toggleCategory(slug)
  }, [toggleCategory])

  const hasActiveCategoryFilter = selectedCategories.length > 0

  // ── Suscripciones a categorías ──────────
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

  useEventObserver(subscribedCategories)

  const keyExtractor = useCallback((item: CampusEvent) => item.id, [])

  const openEvent = useCallback((eventId: string) => {
    router.push(`/eventos/${eventId}` as any)
  }, [])

  const openCreateEvent = useCallback(() => {
    router.push("/crear-evento" as any)
  }, [])

  const renderEventItem = useCallback(
    ({ item }: { item: CampusEvent }) => (
      <EventCard item={item} C={C} onOpen={openEvent} highlight={debouncedSearch} />
    ),
    [C, openEvent, debouncedSearch],
  )

  const renderMyEventItem = useCallback(
    ({ item }: { item: CampusEvent }) => (
      <EventCard item={item} C={C} onOpen={openEvent} />
    ),
    [C, openEvent],
  )

  const emptyTitle = "No hay eventos próximos"
  const emptyBody = useMemo(() => {
    if (!hasActiveCategoryFilter && !search) {
      return "El administrador aún no ha publicado eventos del campus."
    }
    return "No se encontraron eventos con los filtros seleccionados."
  }, [hasActiveCategoryFilter, search])

  const ListHeaderComponent = useMemo(() => (
    <View>
      {/* Search input */}
      <View style={[styles.searchContainer, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Ionicons name="search-outline" size={18} color={C.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: C.textPrimary }]}
          placeholder="Buscar eventos..."
          placeholderTextColor={C.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={C.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        bounces={false}
      >
        {(isAdmin ? (["published", "cancelled", "finished"] as const) : (["published", "cancelled"] as const)).map((s) => {
          const active = selectedStatus === s
          const color = STATUS_COLORS[s]
          const label = STATUS_LABELS[s]
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? color : C.surface,
                  borderColor: active ? color : C.border,
                },
              ]}
              onPress={() => setStatus(s)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterText, { color: active ? "#fff" : C.textSecondary }]}>
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Category filter pills — multi-select */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        bounces={false}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: !hasActiveCategoryFilter ? C.primary : C.surface,
              borderColor: !hasActiveCategoryFilter ? C.primary : C.border,
            },
          ]}
          onPress={clearCategories}
          activeOpacity={0.85}
        >
          <View style={styles.filterInline}>
            <Ionicons name="apps-outline" size={14} color={!hasActiveCategoryFilter ? "#fff" : C.textSecondary} />
            <Text style={[styles.filterText, { color: !hasActiveCategoryFilter ? "#fff" : C.textSecondary }]}>
              Todas
            </Text>
          </View>
        </TouchableOpacity>
        {dbCategories.map((cat) => {
          const active = selectedCategories.includes(cat.slug)
          return (
            <TouchableOpacity
              key={cat.slug}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? C.primary : C.surface,
                  borderColor: active ? C.primary : C.border,
                },
              ]}
              onPress={() => toggleCategoryFilter(cat.slug)}
              onLongPress={() => toggleSubscription(cat.id)}
              activeOpacity={0.85}
            >
              <View style={styles.filterInline}>
                <Ionicons
                  name={categoryIcon(cat.slug)}
                  size={14}
                  color={active ? "#fff" : C.textSecondary}
                />
                <Text style={[styles.filterText, { color: active ? "#fff" : C.textSecondary }]}>
                  {cat.name}
                </Text>
                <Ionicons
                  name={subscribedCategories.includes(cat.id) ? "notifications" : "notifications-off-outline"}
                  size={12}
                  color={active ? "rgba(255,255,255,0.7)" : C.textSecondary}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Total count */}
      <View style={styles.totalRow}>
        <Text style={[styles.totalText, { color: C.textSecondary }]}>
          {meta.total} {meta.total === 1 ? "evento encontrado" : "eventos encontrados"}
        </Text>
      </View>
    </View>
  ), [C, search, setSearch, dbCategories, selectedCategories, hasActiveCategoryFilter, clearCategories, toggleCategoryFilter, toggleSubscription, subscribedCategories, meta.total, selectedStatus, setStatus, isAdmin])

  const ListFooterComponent = useMemo(() => {
    if (meta.totalPages <= 1) return null
    return (
      <View style={styles.paginationRow}>
        <TouchableOpacity
          style={[styles.pageBtn, { backgroundColor: C.surface, borderColor: C.border, opacity: page <= 1 ? 0.4 : 1 }]}
          onPress={() => goToPage(page - 1)}
          disabled={page <= 1}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={18} color={C.textPrimary} />
          <Text style={[styles.pageBtnText, { color: C.textPrimary }]}>Anterior</Text>
        </TouchableOpacity>

        <Text style={[styles.pageInfo, { color: C.textSecondary }]}>
          {page} / {meta.totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.pageBtn, { backgroundColor: C.surface, borderColor: C.border, opacity: page >= meta.totalPages ? 0.4 : 1 }]}
          onPress={() => goToPage(page + 1)}
          disabled={page >= meta.totalPages}
          activeOpacity={0.85}
        >
          <Text style={[styles.pageBtnText, { color: C.textPrimary }]}>Siguiente</Text>
          <Ionicons name="chevron-forward" size={18} color={C.textPrimary} />
        </TouchableOpacity>
      </View>
    )
  }, [C, page, meta.totalPages, goToPage])

  return (
    <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top }]}>

      {/* Cabecera */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="calendar-outline" size={20} color={C.textPrimary} />
          <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Eventos</Text>
        </View>
      </View>

      {/* Tabs: Campus / Mis Eventos */}
      <View style={[styles.tabRow, { borderBottomColor: C.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, tabMode === "campus" && { borderBottomColor: C.primary, borderBottomWidth: 2 }]}
          onPress={() => setTabMode("campus")}
          activeOpacity={0.8}
        >
          <Ionicons name="globe-outline" size={16} color={tabMode === "campus" ? C.primary : C.textSecondary} />
          <Text style={[styles.tabText, { color: tabMode === "campus" ? C.primary : C.textSecondary }]}>
            Eventos del Campus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tabMode === "mis-eventos" && { borderBottomColor: C.primary, borderBottomWidth: 2 }]}
          onPress={() => setTabMode("mis-eventos")}
          activeOpacity={0.8}
        >
          <Ionicons name="person-outline" size={16} color={tabMode === "mis-eventos" ? C.primary : C.textSecondary} />
          <Text style={[styles.tabText, { color: tabMode === "mis-eventos" ? C.primary : C.textSecondary }]}>
            Mis Eventos
          </Text>
        </TouchableOpacity>
      </View>

      {tabMode === "campus" && (
        <>
          {isLoading ? (
            <LoadingState message="Cargando eventos..." />
          ) : (
            <FlatList
              data={events}
              keyExtractor={keyExtractor}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={ListHeaderComponent}
              ListFooterComponent={ListFooterComponent}
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
        </>
      )}

      {tabMode === "mis-eventos" && (
        <>
          {myEventsLoading ? (
            <LoadingState message="Cargando tus eventos..." />
          ) : (
            <FlatList
              data={myEvents}
              keyExtractor={keyExtractor}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={myEventsRefreshing}
                  onRefresh={() => loadMyEvents(true)}
                  tintColor={C.primary}
                  colors={[C.primary]}
                />
              }
              renderItem={renderMyEventItem}
              ListEmptyComponent={
                <EmptyState
                  emoji="📝"
                  iconName="person-outline"
                  title="No tienes eventos"
                  body="Crea tu primer evento con el botón +"
                />
              }
            />
          )}
        </>
      )}

      {/* FAB: Crear Evento */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.primary }]}
        onPress={openCreateEvent}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800" },

  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabText: { fontSize: 14, fontWeight: "600" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

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

  totalRow: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  totalText: { fontSize: 13, fontWeight: "600" },

  list: { padding: 16, gap: 12 },

  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },

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

  cardBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
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

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  fullBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fullBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  cardTitle:    { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  cardDesc:     { fontSize: 13, lineHeight: 18 },
  locationRow:  { flexDirection: "row", alignItems: "center" },
  cardMeta:     { fontSize: 12 },

  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 16,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  pageBtnText: { fontSize: 14, fontWeight: "600" },
  pageInfo: { fontSize: 14, fontWeight: "700" },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
})