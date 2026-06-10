import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Colors } from "@/constants/Colors"
import { useEventCategories } from "@/hooks/useEventCategories"
import { useEventObserver } from "@/hooks/application/useEventObserver"
import { useEvents, type EventFilter } from "@/hooks/application/useEvents"
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

const EventCard = memo(function EventCard({
  item, C, onOpen, showActions, onEdit, onPublish, onCancel, onDelete
}: {
  item: CampusEvent; C: typeof Colors["light"]; onOpen: (eventId: string) => void;
  showActions?: boolean; onEdit?: (id: string) => void; onPublish?: (id: string) => void;
  onCancel?: (id: string) => void; onDelete?: (id: string) => void;
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

  const handleOpen = useCallback(() => { onOpen(item.id) }, [onOpen, item.id])
  const handleEdit = useCallback(() => { onEdit?.(item.id) }, [onEdit, item.id])
  const handlePublish = useCallback(() => { onPublish?.(item.id) }, [onPublish, item.id])
  const handleCancel = useCallback(() => { onCancel?.(item.id) }, [onCancel, item.id])
  const handleDelete = useCallback(() => { onDelete?.(item.id) }, [onDelete, item.id])

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

          {showActions && status === "draft" && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: C.primary + "20" }]}
                onPress={handleEdit}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={14} color={C.primary} />
                <Text style={[styles.actionBtnText, { color: C.primary }]}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#22c55e20" }]}
                onPress={handlePublish}
                activeOpacity={0.85}
              >
                <Ionicons name="paper-plane-outline" size={14} color="#22c55e" />
                <Text style={[styles.actionBtnText, { color: "#22c55e" }]}>Publicar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#ef444420" }]}
                onPress={handleDelete}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}

          {showActions && status === "published" && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#ef444420" }]}
                onPress={handleCancel}
                activeOpacity={0.85}
              >
                <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
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

  const [tabMode, setTabMode] = useState<TabMode>("campus")
  const { filteredEvents, isLoading, isRefreshing, activeFilter, setActiveFilter, refresh } = useEvents()
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

  const handlePublishMyEvent = useCallback(async (eventId: string) => {
    if (!userId) return
    try {
      const repo = DIContainer.getInstance().getEventRepository()
      await repo.publish(eventId)
      setMyEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, status: "published" } : e))
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo publicar el evento")
    }
  }, [userId])

  const handleDeleteMyEvent = useCallback(async (eventId: string) => {
    if (!userId) return
    Alert.alert(
      "Eliminar borrador",
      "¿Eliminar este borrador? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive",
          onPress: async () => {
            try {
              const repo = DIContainer.getInstance().getEventRepository()
              await repo.delete(eventId, userId)
              setMyEvents((prev) => prev.filter((e) => e.id !== eventId))
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo eliminar el evento")
            }
          },
        },
      ]
    )
  }, [userId])

  const handleCancelMyEvent = useCallback(async (eventId: string) => {
    if (!userId) return
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
              await repo.cancel(eventId)
              setMyEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, status: "cancelled" } : e))
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "No se pudo cancelar el evento")
            }
          },
        },
      ]
    )
  }, [userId])

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

  const openEditEvent = useCallback((eventId: string) => {
    router.push(`/editar-evento/${eventId}` as any)
  }, [])

  const renderEventItem = useCallback(
    ({ item }: { item: CampusEvent }) => (
      <EventCard item={item} C={C} onOpen={openEvent} />
    ),
    [C, openEvent],
  )

  const renderMyEventItem = useCallback(
    ({ item }: { item: CampusEvent }) => (
      <EventCard
        item={item}
        C={C}
        onOpen={openEvent}
        showActions
        onEdit={openEditEvent}
        onPublish={handlePublishMyEvent}
        onCancel={handleCancelMyEvent}
        onDelete={handleDeleteMyEvent}
      />
    ),
    [C, openEvent, openEditEvent, handlePublishMyEvent, handleCancelMyEvent, handleDeleteMyEvent],
  )

  const handleSetFilter = useCallback(
    (filter: EventFilter) => { setActiveFilter(filter) },
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
              Mantén presionada una categoría para suscribirte
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
  cardTitle:    { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  cardDesc:     { fontSize: 13, lineHeight: 18 },
  locationRow:  { flexDirection: "row", alignItems: "center" },
  cardMeta:     { fontSize: 12 },

  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: "700" },

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
