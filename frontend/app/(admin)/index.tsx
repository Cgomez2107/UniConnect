// Panel de administración UniConnect.

import { AdminHeader } from "@/components/admin/AdminHeader"
import { CategoryModalFields, EventModalFields, FacultyModalFields, ProgramModalFields, SubjectModalFields } from "@/components/admin/AdminCatalogModalFields"
import { AdminMetricsPanel } from "@/components/admin/AdminMetricsPanel"
import { AdminSearchBar } from "@/components/admin/AdminSearchBar"
import { AdminTabs, type ActiveTab } from "@/components/admin/AdminTabs"
import { CrudModal } from "@/components/admin/CrudModal"
import { FacultyRow, ProgramRow, SubjectRow, UserRow, RequestRow, ResourceRow, EventRow } from "@/components/admin/CatalogRow"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Colors } from "@/constants/Colors"
import { useAdmin } from "@/hooks/application/useAdmin"
import { useAuthStore } from "@/store/useAuthStore"
import type { AdminEvent, AdminRequest, AdminResource, AdminUser, EventCategoryRow, Faculty, Program, Subject } from "@/types"
import { router, useLocalSearchParams } from "expo-router"
import * as Haptics from "expo-haptics"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { fetchApiEnvelope } from "@/lib/api/httpClient"

export default function AdminPanelScreen() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const user    = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const insets  = useSafeAreaInsets()

  const params = useLocalSearchParams<{ tab?: string }>()
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    (params.tab as ActiveTab) ?? "facultades",
  )
  const [search,    setSearch]    = useState("")
  const [moderationCount, setModerationCount] = useState(0)

  const admin = useAdmin(search)

  // Detail modal state
  const [detailEvent, setDetailEvent] = useState<AdminEvent | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  // Fetch moderation case count for the tab badge
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await fetchApiEnvelope<any[]>("/notifications?limit=50")
        const raw = Array.isArray(data) ? data : []
        const count = raw.filter((n: any) => n.type === "moderation_escalation").length
        if (!cancelled) setModerationCount(count)
      } catch {
        // silently ignore – badge stays at 0
      }
    })()
    return () => { cancelled = true }
  }, [])

  const openEventDetail = useCallback((item: AdminEvent) => {
    setDetailEvent(item)
    setDetailModalVisible(true)
  }, [])

  const tabs = useMemo(
    () => [
      { key: "facultades" as ActiveTab, icon: "business-outline" as const, label: "Facultades", count: admin.faculties.length },
      { key: "programas" as ActiveTab, icon: "school-outline" as const, label: "Programas", count: admin.programs.length },
      { key: "materias" as ActiveTab, icon: "book-outline" as const, label: "Materias", count: admin.subjects.length },
      { key: "usuarios" as ActiveTab, icon: "people-outline" as const, label: "Usuarios", count: admin.users.length },
      { key: "solicitudes" as ActiveTab, icon: "document-text-outline" as const, label: "Solicitudes", count: admin.requests.length },
      { key: "recursos" as ActiveTab, icon: "folder-open-outline" as const, label: "Recursos", count: admin.resources.length },
      { key: "eventos" as ActiveTab, icon: "calendar-outline" as const, label: "Eventos", count: admin.events.length },
      { key: "moderacion" as ActiveTab, icon: "shield-checkmark-outline" as const, label: "Moderación", count: moderationCount },
      { key: "metricas" as ActiveTab, icon: "stats-chart-outline" as const, label: "Métricas", count: 0 },
    ],
    [
      admin.faculties.length,
      admin.programs.length,
      admin.subjects.length,
      admin.users.length,
      admin.requests.length,
      admin.resources.length,
      admin.events.length,
      moderationCount,
    ],
  )

  const listContentStyle = useMemo(
    () => [styles.list, { paddingBottom: insets.bottom + 80 }],
    [insets.bottom],
  )

  const metricsContentStyle = useMemo(
    () => [styles.metricsContainer, { paddingBottom: insets.bottom + 80 }],
    [insets.bottom],
  )

  const searchPlaceholder = useMemo(() => {
    if (activeTab === "facultades") return "Buscar facultad..."
    if (activeTab === "programas") return "Buscar programa o facultad..."
    if (activeTab === "materias") return "Buscar materia..."
    if (activeTab === "usuarios") return "Buscar usuario o email..."
    if (activeTab === "solicitudes") return "Buscar solicitud o autor..."
    if (activeTab === "recursos") return "Buscar recurso o autor..."
    if (activeTab === "eventos") return "Buscar evento o lugar..."
    return "Métricas globales"
  }, [activeTab])

  const handleTabChange = useCallback((tab: ActiveTab) => {
    if (tab === "moderacion") {
      router.push("/(admin)/moderacion" as any)
      return
    }
    setActiveTab(tab)
  }, [])

  const handleSignOut = useCallback(() => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: async () => {
        await signOut()
        router.replace("/login")
      }},
    ])
  }, [signOut])

  const handleAddPress = useCallback(() => {
    if (activeTab === "facultades") {
      admin.openCreateFaculty()
    } else if (activeTab === "programas") {
      admin.openCreateProgram()
    } else if (activeTab === "eventos") {
      admin.openCreateEvent()
    } else {
      admin.openCreateSubject()
    }
  }, [activeTab, admin])

  const handleAddPressWithHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    handleAddPress()
  }, [handleAddPress])

  const keyExtractor = useCallback((i: { id: string }) => i.id, [])

  const renderFacultyItem = useCallback(
    ({ item, index }: { item: Faculty; index: number }) => (
      <FacultyRow
        item={item}
        index={index}
        programsCount={admin.programsCountForFaculty(item.id)}
        onEdit={() => admin.openEditFaculty(item)}
        onDelete={() => admin.deleteFaculty(item)}
        C={C}
      />
    ),
    [admin, C],
  )

  const renderProgramItem = useCallback(
    ({ item, index }: { item: Program; index: number }) => (
      <ProgramRow
        item={item}
        index={index}
        subjectsCount={admin.subjectsCountForProgram(item.id)}
        onEdit={() => admin.openEditProgram(item)}
        onDelete={() => admin.deleteProgram(item)}
        C={C}
      />
    ),
    [admin, C],
  )

  const renderSubjectItem = useCallback(
    ({ item }: { item: Subject }) => (
      <SubjectRow
        item={item}
        programs={admin.programsForSubject(item.id)}
        onEdit={() => admin.openEditSubject(item)}
        onDelete={() => admin.deleteSubject(item)}
        C={C}
      />
    ),
    [admin, C],
  )

  const renderUserItem = useCallback(
    ({ item }: { item: AdminUser }) => (
      <UserRow
        item={item}
        onToggleRole={() => admin.handleToggleUserRole(item)}
        onToggleActive={() => admin.handleToggleUserActive(item)}
        C={C}
      />
    ),
    [admin, C],
  )

  const renderRequestItem = useCallback(
    ({ item }: { item: AdminRequest }) => (
      <RequestRow
        item={item}
        onClose={() => admin.handleCloseRequest(item)}
        onDelete={() => admin.handleDeleteRequest(item)}
        C={C}
      />
    ),
    [admin, C],
  )

  const renderResourceItem = useCallback(
    ({ item }: { item: AdminResource }) => (
      <ResourceRow
        item={item}
        onDelete={() => admin.handleDeleteResource(item)}
        C={C}
      />
    ),
    [admin, C],
  )

  const renderEventItem = useCallback(
    ({ item }: { item: AdminEvent }) => (
      <EventRow
        item={item}
        onEdit={() => admin.openEditEvent(item)}
        onDelete={() => admin.handleDeleteEvent(item)}
        onPublish={item.status === "draft" ? () => admin.handlePublishEvent(item) : undefined}
        onCancel={item.status === "published" ? () => admin.handleCancelEvent(item) : undefined}
        onViewDetails={() => openEventDetail(item)}
        C={C}
      />
    ),
    [admin, C, openEventDetail],
  )

  // Render
  return (
    <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <AdminHeader userName={user?.fullName ?? "Admin"} onSignOut={handleSignOut} C={C} />

      <AdminTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        C={C}
      />

      {activeTab !== "metricas" && (
        <AdminSearchBar
          activeTab={activeTab}
          search={search}
          setSearch={setSearch}
          searchPlaceholder={searchPlaceholder}
          onAddPress={handleAddPressWithHaptic}
          C={C}
        />
      )}

      {/* Contenido principal */}
      {admin.isLoading ? (
        <LoadingState message="Cargando datos..." />
      ) : (
        <>
          {activeTab === "facultades" && (
            <FlatList
              data={admin.filteredFaculties}
              keyExtractor={keyExtractor}
              contentContainerStyle={listContentStyle}
              showsVerticalScrollIndicator={false}
              renderItem={renderFacultyItem}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="business-outline" title="No hay facultades" body="" />}
            />
          )}

          {activeTab === "programas" && (
            <FlatList
              data={admin.filteredPrograms}
              keyExtractor={keyExtractor}
              contentContainerStyle={listContentStyle}
              showsVerticalScrollIndicator={false}
              renderItem={renderProgramItem}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="school-outline" title="No hay programas" body="" />}
            />
          )}

          {activeTab === "materias" && (
            <FlatList
              data={admin.filteredSubjects}
              keyExtractor={keyExtractor}
              contentContainerStyle={listContentStyle}
              showsVerticalScrollIndicator={false}
              renderItem={renderSubjectItem}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="book-outline" title="No hay materias" body="" />}
            />
          )}

          {activeTab === "usuarios" && (
            <FlatList
              data={admin.filteredUsers}
              keyExtractor={keyExtractor}
              contentContainerStyle={listContentStyle}
              showsVerticalScrollIndicator={false}
              renderItem={renderUserItem}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="people-outline" title="No hay usuarios" body="" />}
            />
          )}

          {activeTab === "solicitudes" && (
            <FlatList
              data={admin.filteredRequests}
              keyExtractor={keyExtractor}
              contentContainerStyle={listContentStyle}
              showsVerticalScrollIndicator={false}
              renderItem={renderRequestItem}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="document-text-outline" title="No hay solicitudes" body="" />}
            />
          )}

          {activeTab === "recursos" && (
            <FlatList
              data={admin.filteredResources}
              keyExtractor={keyExtractor}
              contentContainerStyle={listContentStyle}
              showsVerticalScrollIndicator={false}
              renderItem={renderResourceItem}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="folder-open-outline" title="No hay recursos" body="" />}
            />
          )}

          {activeTab === "eventos" && (
            <FlatList
              data={admin.filteredEvents}
              keyExtractor={keyExtractor}
              contentContainerStyle={listContentStyle}
              showsVerticalScrollIndicator={false}
              renderItem={renderEventItem}
              ListHeaderComponent={
                <>
                  <View style={[styles.categorySection, { borderColor: C.border, marginBottom: 12 }]}>
                    <Text style={[styles.categorySectionTitle, { color: C.textPrimary }]}>
                      Gestión de Categorías
                    </Text>
                    <Text style={[styles.categorySectionSub, { color: C.textSecondary }]}>
                      {admin.eventCategories.length} categoría(s) disponibles
                    </Text>
                    <View style={styles.categoryChipsRow}>
                      {admin.eventCategories.map((cat: EventCategoryRow) => (
                        <View key={cat.id} style={[styles.categoryChip, { backgroundColor: C.primary + "15", borderColor: C.border }]}>
                          <Text style={[styles.categoryChipText, { color: C.textPrimary }]}>{cat.name}</Text>
                          <TouchableOpacity
                            onPress={() => admin.openEditCategory(cat)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={[styles.categoryAction, { color: C.primary }]}>✎</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => admin.handleDeleteCategory(cat)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={[styles.categoryAction, { color: C.error }]}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity
                        style={[styles.addCategoryChip, { borderColor: C.primary }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          admin.openCreateCategory()
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.addCategoryChipText, { color: C.primary }]}>+ Nueva</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Filtros */}
                  <View style={[styles.filterSection, { borderColor: C.border, marginBottom: 12 }]}>
                    <View style={styles.filterRow}>
                      <Text style={[styles.filterLabel, { color: C.textSecondary }]}>Estado:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[["all", "Todos"], ["draft", "Borrador"], ["published", "Publicado"], ["cancelled", "Cancelado"], ["finished", "Finalizado"]].map(([key, label]) => (
                          <TouchableOpacity
                            key={key}
                            style={[styles.filterChip, {
                              backgroundColor: admin.statusFilter === key ? C.primary : C.surface,
                              borderColor: admin.statusFilter === key ? C.primary : C.border,
                            }]}
                            onPress={() => admin.setStatusFilter(key)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.filterChipText, {
                              color: admin.statusFilter === key ? "#fff" : C.textSecondary,
                            }]}>{label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.filterRow}>
                      <Text style={[styles.filterLabel, { color: C.textSecondary }]}>Categoría:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                          style={[styles.filterChip, {
                            backgroundColor: admin.categoryFilter === "all" ? C.primary : C.surface,
                            borderColor: admin.categoryFilter === "all" ? C.primary : C.border,
                          }]}
                          onPress={() => admin.setCategoryFilter("all")}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.filterChipText, {
                            color: admin.categoryFilter === "all" ? "#fff" : C.textSecondary,
                          }]}>Todas</Text>
                        </TouchableOpacity>
                        {admin.eventCategories.map((cat: EventCategoryRow) => (
                          <TouchableOpacity
                            key={cat.id}
                            style={[styles.filterChip, {
                              backgroundColor: admin.categoryFilter === cat.id ? C.primary : C.surface,
                              borderColor: admin.categoryFilter === cat.id ? C.primary : C.border,
                            }]}
                            onPress={() => admin.setCategoryFilter(cat.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.filterChipText, {
                              color: admin.categoryFilter === cat.id ? "#fff" : C.textSecondary,
                            }]}>{cat.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.filterRow}>
                      <Text style={[styles.filterLabel, { color: C.textSecondary }]}>Otros:</Text>
                      <TouchableOpacity
                        style={[styles.filterChip, {
                          backgroundColor: admin.includeDeleted ? "#ef4444" : C.surface,
                          borderColor: admin.includeDeleted ? "#ef4444" : C.border,
                        }]}
                        onPress={() => admin.setIncludeDeleted(!admin.includeDeleted)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.filterChipText, {
                          color: admin.includeDeleted ? "#fff" : C.textSecondary,
                        }]}>Ver eliminados</Text>
                      </TouchableOpacity>
                    </View>

                    {(admin.statusFilter !== "all" || admin.categoryFilter !== "all" || admin.includeDeleted) && (
                      <TouchableOpacity
                        style={[styles.clearFilterBtn, { borderColor: C.error }]}
                        onPress={() => {
                          admin.setStatusFilter("all")
                          admin.setCategoryFilter("all")
                          admin.setIncludeDeleted(false)
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.clearFilterBtnText, { color: C.error }]}>✕ Limpiar filtros</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              }
              ListEmptyComponent={<EmptyState emoji="📅" iconName="calendar-outline" title="No hay eventos" body="Crea el primer evento del campus" />}
            />
          )}

          {activeTab === "metricas" && (
            <ScrollView contentContainerStyle={metricsContentStyle}>
              <AdminMetricsPanel metrics={admin.metrics} C={C} />
            </ScrollView>
          )}
        </>
      )}

      <CrudModal
        visible={admin.facultyModal.visible}
        title={admin.facultyModal.mode === "create" ? "Nueva facultad" : "Editar facultad"}
        error={admin.facultyModal.error}
        isSubmitting={admin.isSubmitting}
        onClose={admin.closeFacultyModal}
        onSave={admin.saveFaculty}
        C={C}
      >
        <FacultyModalFields C={C} modal={admin.facultyModal} setModal={admin.setFacultyModal} />
      </CrudModal>

      <CrudModal
        visible={admin.programModal.visible}
        title={admin.programModal.mode === "create" ? "Nuevo programa" : "Editar programa"}
        error={admin.programModal.error}
        isSubmitting={admin.isSubmitting}
        onClose={admin.closeProgramModal}
        onSave={admin.saveProgram}
        C={C}
      >
        <ProgramModalFields
          C={C}
          modal={admin.programModal}
          setModal={admin.setProgramModal}
          faculties={admin.faculties}
        />
      </CrudModal>

      <CrudModal
        visible={admin.subjectModal.visible}
        title={admin.subjectModal.mode === "create" ? "Nueva materia" : "Editar materia"}
        error={admin.subjectModal.error}
        isSubmitting={admin.isSubmitting}
        onClose={admin.closeSubjectModal}
        onSave={admin.saveSubject}
        C={C}
      >
        <SubjectModalFields
          C={C}
          modal={admin.subjectModal}
          setModal={admin.setSubjectModal}
          programs={admin.programs}
        />
      </CrudModal>

      <CrudModal
        visible={admin.eventModal.visible}
        title={admin.eventModal.mode === "create" ? "Nuevo evento" : "Editar evento"}
        error={admin.eventModal.error}
        isSubmitting={admin.isSubmitting}
        onClose={admin.closeEventModal}
        onSave={admin.saveEvent}
        C={C}
      >
        <EventModalFields C={C} modal={admin.eventModal} setModal={admin.setEventModal} categories={admin.eventCategories} />
      </CrudModal>

      <CrudModal
        visible={admin.categoryModal.visible}
        title={admin.categoryModal.mode === "create" ? "Nueva categoría" : "Editar categoría"}
        error={admin.categoryModal.error}
        isSubmitting={admin.isSubmitting}
        onClose={admin.closeCategoryModal}
        onSave={admin.saveCategory}
        C={C}
      >
        <CategoryModalFields C={C} modal={admin.categoryModal} setModal={admin.setCategoryModal} />
      </CrudModal>

      {/* Event detail modal */}
      <CrudModal
        visible={detailModalVisible}
        title={detailEvent?.title ?? "Detalle del evento"}
        error=""
        isSubmitting={false}
        readonly
        onClose={() => setDetailModalVisible(false)}
        onSave={() => {}}
        C={C}
      >
        {detailEvent && (
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Text style={{ fontSize: 13, color: C.textSecondary }}>
                {detailEvent.status === "draft" ? "Borrador" : detailEvent.status === "published" ? "Publicado" : detailEvent.status === "cancelled" ? "Cancelado" : "Finalizado"}
              </Text>
              <Text style={{ fontSize: 13, color: C.textSecondary }}>•</Text>
              <Text style={{ fontSize: 13, color: C.textSecondary, textTransform: "capitalize" }}>{detailEvent.category}</Text>
            </View>

            {detailEvent.description && (
              <Text style={{ fontSize: 14, color: C.textSecondary, lineHeight: 20 }}>
                {detailEvent.description}
              </Text>
            )}

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: C.textSecondary, textTransform: "uppercase" }}>Fecha</Text>
                <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>
                  {detailEvent.event_date ? new Date(detailEvent.event_date).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: C.textSecondary, textTransform: "uppercase" }}>Lugar</Text>
                <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>{detailEvent.location || "—"}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: C.textSecondary, textTransform: "uppercase" }}>Cupo máximo</Text>
                <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>{detailEvent.max_capacity ?? "Ilimitado"}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: C.textSecondary, textTransform: "uppercase" }}>Registrados</Text>
                <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>{detailEvent.registered_count ?? 0}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: C.textSecondary, textTransform: "uppercase" }}>Creador</Text>
                <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>{detailEvent.creator_name || "—"}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: C.textSecondary, textTransform: "uppercase" }}>Creado</Text>
                <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>
                  {detailEvent.created_at ? new Date(detailEvent.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </CrudModal>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: 16, gap: 8 },
  // Métricas
  metricsContainer: { padding: 16, gap: 12 },
  // Gestión de categorías
  categorySection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  categorySectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  categorySectionSub: { fontSize: 12, marginBottom: 10 },
  categoryChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  categoryChipText: { fontSize: 13, fontWeight: "600" },
  categoryAction: { fontSize: 14, fontWeight: "700", paddingLeft: 2 },
  addCategoryChip: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addCategoryChipText: { fontSize: 13, fontWeight: "600" },
  // Filtros
  filterSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterLabel: { fontSize: 13, fontWeight: "600", minWidth: 60 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  clearFilterBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-end",
  },
  clearFilterBtnText: { fontSize: 12, fontWeight: "600" },
})
