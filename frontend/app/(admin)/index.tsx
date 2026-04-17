// Panel de administración UniConnect.

import { AdminHeader } from "@/components/admin/AdminHeader"
import { EventModalFields, FacultyModalFields, ProgramModalFields, SubjectModalFields } from "@/components/admin/AdminCatalogModalFields"
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
import type { AdminEvent, AdminRequest, AdminResource, AdminUser, Faculty, Program, Subject } from "@/types"
import { router } from "expo-router"
import * as Haptics from "expo-haptics"
import { StatusBar } from "expo-status-bar"
import { useCallback, useMemo, useState } from "react"
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function AdminPanelScreen() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const user    = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const insets  = useSafeAreaInsets()

  const [activeTab, setActiveTab] = useState<ActiveTab>("facultades")
  const [search,    setSearch]    = useState("")

  const admin = useAdmin(search)

  const tabs = useMemo(
    () => [
      { key: "facultades" as ActiveTab, icon: "business-outline" as const, label: "Facultades", count: admin.faculties.length },
      { key: "programas" as ActiveTab, icon: "school-outline" as const, label: "Programas", count: admin.programs.length },
      { key: "materias" as ActiveTab, icon: "book-outline" as const, label: "Materias", count: admin.subjects.length },
      { key: "usuarios" as ActiveTab, icon: "people-outline" as const, label: "Usuarios", count: admin.users.length },
      { key: "solicitudes" as ActiveTab, icon: "document-text-outline" as const, label: "Solicitudes", count: admin.requests.length },
      { key: "recursos" as ActiveTab, icon: "folder-open-outline" as const, label: "Recursos", count: admin.resources.length },
      { key: "eventos" as ActiveTab, icon: "calendar-outline" as const, label: "Eventos", count: admin.events.length },
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
    setActiveTab(tab)
    setSearch("")
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
        C={C}
      />
    ),
    [admin, C],
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
        <EventModalFields C={C} modal={admin.eventModal} setModal={admin.setEventModal} />
      </CrudModal>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: 16, gap: 8 },
  // Métricas
  metricsContainer: { padding: 16, gap: 12 },
})
