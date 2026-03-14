// Panel de administración UniConnect.

import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminTabs, type ActiveTab } from "@/components/admin/AdminTabs"
import { CrudModal, FieldLabel } from "@/components/admin/CrudModal"
import { FacultyRow, ProgramRow, SubjectRow, UserRow, RequestRow, ResourceRow, EventRow } from "@/components/admin/CatalogRow"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Colors } from "@/constants/Colors"
import { useAdmin } from "@/hooks/useAdmin"
import { useAuthStore } from "@/store/useAuthStore"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import * as Haptics from "expo-haptics"
import { StatusBar } from "expo-status-bar"
import { useState } from "react"
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

  // Tabs config
  const TABS: { key: ActiveTab; icon: keyof typeof Ionicons.glyphMap; label: string; count: number }[] = [
    { key: "facultades"  as ActiveTab, icon: "business-outline", label: "Facultades",  count: admin.faculties.length  },
    { key: "programas"   as ActiveTab, icon: "school-outline",   label: "Programas",   count: admin.programs.length   },
    { key: "materias"    as ActiveTab, icon: "book-outline",     label: "Materias",    count: admin.subjects.length   },
    { key: "usuarios"    as ActiveTab, icon: "people-outline",   label: "Usuarios",    count: admin.users.length      },
    { key: "solicitudes" as ActiveTab, icon: "document-text-outline", label: "Solicitudes", count: admin.requests.length   },
    { key: "recursos"    as ActiveTab, icon: "folder-open-outline",   label: "Recursos",    count: admin.resources.length  },
    { key: "eventos"     as ActiveTab, icon: "calendar-outline",       label: "Eventos",     count: admin.events.length     },
    { key: "metricas"    as ActiveTab, icon: "stats-chart-outline",    label: "Métricas",    count: 0                       },
  ]

  // Tabs que tienen botón + Nuevo
  const TABS_WITH_ADD = ["facultades", "programas", "materias", "eventos"]

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: async () => {
        await signOut()
        router.replace("/login")
      }},
    ])
  }

  const handleAddPress = () => {
    if (activeTab === "facultades") {
      admin.openCreateFaculty()
    } else if (activeTab === "programas") {
      admin.openCreateProgram()
    } else if (activeTab === "eventos") {
      admin.openCreateEvent()
    } else {
      admin.openCreateSubject()
    }
  }

  // Render
  return (
    <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <AdminHeader userName={user?.fullName ?? "Admin"} onSignOut={handleSignOut} C={C} />

      <AdminTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setSearch("") }}
        C={C}
      />

      {activeTab !== "metricas" && (
      <View style={[styles.searchRow, { borderBottomColor: C.border }]}>
        <View style={[styles.searchBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.textPlaceholder} style={{ marginRight: 6 }} />
          <TextInput
            style={[styles.searchInput, { color: C.textPrimary }]}
            placeholder={
              activeTab === "facultades"  ? "Buscar facultad..." :
              activeTab === "programas"   ? "Buscar programa o facultad..." :
              activeTab === "materias"    ? "Buscar materia..." :
              activeTab === "usuarios"    ? "Buscar usuario o email..." :
              activeTab === "solicitudes" ? "Buscar solicitud o autor..." :
              activeTab === "recursos"    ? "Buscar recurso o autor..." :
              activeTab === "eventos"     ? "Buscar evento o lugar..." :
              "Métricas globales"
            }
            placeholderTextColor={C.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            editable
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={C.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {TABS_WITH_ADD.includes(activeTab) && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: C.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              handleAddPress()
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>+ Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>
      )}

      {/* Contenido principal */}
      {admin.isLoading ? (
        <LoadingState message="Cargando datos..." />
      ) : (
        <>
          {activeTab === "facultades" && (
            <FlatList
              data={admin.filteredFaculties}
              keyExtractor={(i) => i.id}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <FacultyRow
                  item={item}
                  index={index}
                  programsCount={admin.programsCountForFaculty(item.id)}
                  onEdit={() => admin.openEditFaculty(item)}
                  onDelete={() => admin.deleteFaculty(item)}
                  C={C}
                />
              )}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="business-outline" title="No hay facultades" body="" />}
            />
          )}

          {activeTab === "programas" && (
            <FlatList
              data={admin.filteredPrograms}
              keyExtractor={(i) => i.id}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <ProgramRow
                  item={item}
                  index={index}
                  subjectsCount={admin.subjectsCountForProgram(item.id)}
                  onEdit={() => admin.openEditProgram(item)}
                  onDelete={() => admin.deleteProgram(item)}
                  C={C}
                />
              )}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="school-outline" title="No hay programas" body="" />}
            />
          )}

          {activeTab === "materias" && (
            <FlatList
              data={admin.filteredSubjects}
              keyExtractor={(i) => i.id}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <SubjectRow
                  item={item}
                  programs={admin.programsForSubject(item.id)}
                  onEdit={() => admin.openEditSubject(item)}
                  onDelete={() => admin.deleteSubject(item)}
                  C={C}
                />
              )}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="book-outline" title="No hay materias" body="" />}
            />
          )}

          {activeTab === "usuarios" && (
            <FlatList
              data={admin.filteredUsers}
              keyExtractor={(i) => i.id}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <UserRow
                  item={item}
                  onToggleRole={() => admin.handleToggleUserRole(item)}
                  onToggleActive={() => admin.handleToggleUserActive(item)}
                  C={C}
                />
              )}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="people-outline" title="No hay usuarios" body="" />}
            />
          )}

          {activeTab === "solicitudes" && (
            <FlatList
              data={admin.filteredRequests}
              keyExtractor={(i) => i.id}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <RequestRow
                  item={item}
                  onClose={() => admin.handleCloseRequest(item)}
                  onDelete={() => admin.handleDeleteRequest(item)}
                  C={C}
                />
              )}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="document-text-outline" title="No hay solicitudes" body="" />}
            />
          )}

          {activeTab === "recursos" && (
            <FlatList
              data={admin.filteredResources}
              keyExtractor={(i) => i.id}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ResourceRow
                  item={item}
                  onDelete={() => admin.handleDeleteResource(item)}
                  C={C}
                />
              )}
              ListEmptyComponent={<EmptyState emoji="📭" iconName="folder-open-outline" title="No hay recursos" body="" />}
            />
          )}

          {activeTab === "eventos" && (
            <FlatList
              data={admin.filteredEvents}
              keyExtractor={(i) => i.id}
              contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <EventRow
                  item={item}
                  onEdit={() => admin.openEditEvent(item)}
                  onDelete={() => admin.handleDeleteEvent(item)}
                  C={C}
                />
              )}
              ListEmptyComponent={<EmptyState emoji="📅" iconName="calendar-outline" title="No hay eventos" body="Crea el primer evento del campus" />}
            />
          )}

          {activeTab === "metricas" && (
            <ScrollView contentContainerStyle={[styles.metricsContainer, { paddingBottom: insets.bottom + 80 }]}>
              {admin.metrics ? (
                <>
                  <View style={[styles.metricCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <View style={[styles.metricIconWrap, { backgroundColor: C.primary + "14" }]}>
                      <Ionicons name="people-outline" size={24} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metricValue, { color: C.textPrimary }]}>{admin.metrics.totalUsers}</Text>
                      <Text style={[styles.metricLabel, { color: C.textSecondary }]}>Usuarios totales</Text>
                    </View>
                  </View>
                  <View style={[styles.metricCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <View style={[styles.metricIconWrap, { backgroundColor: C.primary + "14" }]}>
                      <Ionicons name="school-outline" size={24} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metricValue, { color: C.textPrimary }]}>{admin.metrics.activeStudents}</Text>
                      <Text style={[styles.metricLabel, { color: C.textSecondary }]}>Estudiantes activos</Text>
                    </View>
                  </View>
                  <View style={[styles.metricCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <View style={[styles.metricIconWrap, { backgroundColor: C.primary + "14" }]}>
                      <Ionicons name="document-text-outline" size={24} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metricValue, { color: C.textPrimary }]}>{admin.metrics.openRequests}</Text>
                      <Text style={[styles.metricLabel, { color: C.textSecondary }]}>Solicitudes abiertas</Text>
                    </View>
                  </View>
                  <View style={[styles.metricCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <View style={[styles.metricIconWrap, { backgroundColor: C.primary + "14" }]}>
                      <Ionicons name="folder-open-outline" size={24} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metricValue, { color: C.textPrimary }]}>{admin.metrics.totalResources}</Text>
                      <Text style={[styles.metricLabel, { color: C.textSecondary }]}>Recursos subidos</Text>
                    </View>
                  </View>
                  <View style={[styles.metricCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <View style={[styles.metricIconWrap, { backgroundColor: C.primary + "14" }]}>
                      <Ionicons name="chatbubble-ellipses-outline" size={24} color={C.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metricValue, { color: C.textPrimary }]}>{admin.metrics.totalMessages}</Text>
                      <Text style={[styles.metricLabel, { color: C.textSecondary }]}>Mensajes enviados</Text>
                    </View>
                  </View>
                </>
              ) : (
                <EmptyState emoji="📊" iconName="stats-chart-outline" title="Sin datos" body="No se pudieron cargar las métricas." />
              )}
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
        <FieldLabel text="Nombre de la facultad *" C={C} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Ingenieria"
          placeholderTextColor={C.textPlaceholder}
          value={admin.facultyModal.form.name}
          autoCapitalize="words"
          autoFocus
          onChangeText={(v) =>
            admin.setFacultyModal((p: any) => ({ ...p, form: { name: v }, error: "" }))
          }
        />
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
        <FieldLabel text="Nombre del programa *" C={C} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Ingenieria de Sistemas"
          placeholderTextColor={C.textPlaceholder}
          value={admin.programModal.form.name}
          autoCapitalize="words"
          autoFocus
          onChangeText={(v) =>
            admin.setProgramModal((p: any) => ({ ...p, form: { ...p.form, name: v }, error: "" }))
          }
        />
        <FieldLabel text="Facultad *" C={C} style={{ marginTop: 14 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
          {admin.faculties.map((f: any) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.chip,
                {
                  backgroundColor: admin.programModal.form.faculty_id === f.id ? C.primary : C.background,
                  borderColor: admin.programModal.form.faculty_id === f.id ? C.primary : C.border,
                },
              ]}
              onPress={() =>
                admin.setProgramModal((p: any) => ({ ...p, form: { ...p.form, faculty_id: f.id }, error: "" }))
              }
              activeOpacity={0.8}
            >
              <Text style={[
                styles.chipText,
                { color: admin.programModal.form.faculty_id === f.id ? "#fff" : C.textSecondary },
              ]}>
                {f.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
        <FieldLabel text="Nombre de la materia *" C={C} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Calculo Diferencial"
          placeholderTextColor={C.textPlaceholder}
          value={admin.subjectModal.form.name}
          autoCapitalize="words"
          autoFocus
          onChangeText={(v) =>
            admin.setSubjectModal((p: any) => ({ ...p, form: { ...p.form, name: v }, error: "" }))
          }
        />
        <FieldLabel text="Programas vinculados * (seleccion multiple)" C={C} style={{ marginTop: 14 }} />
        <View style={styles.chipsWrap}>
          {admin.programs.map((prog: any) => {
            const selected = admin.subjectModal.form.program_ids.includes(prog.id)
            return (
              <TouchableOpacity
                key={prog.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? C.primary : C.background,
                    borderColor: selected ? C.primary : C.border,
                  },
                ]}
                onPress={() =>
                  admin.setSubjectModal((p: any) => ({
                    ...p,
                    form: {
                      ...p.form,
                      program_ids: selected
                        ? p.form.program_ids.filter((id: string) => id !== prog.id)
                        : [...p.form.program_ids, prog.id],
                    },
                    error: "",
                  }))
                }
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: selected ? "#fff" : C.textSecondary }]}>
                  {prog.name}
                </Text>
                <Text style={[styles.chipSub, { color: selected ? "rgba(255,255,255,0.7)" : C.textPlaceholder }]}>
                  {prog.faculty_name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
        {admin.subjectModal.form.program_ids.length > 0 && (
          <View style={[styles.selectionInfo, { backgroundColor: C.primary + "12" }]}>
            <Text style={[styles.selectionInfoText, { color: C.primary }]}>
              {admin.subjectModal.form.program_ids.length} programa(s) seleccionado(s)
            </Text>
          </View>
        )}
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
        <FieldLabel text="Título *" C={C} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Semana de la Ingeniería"
          placeholderTextColor={C.textPlaceholder}
          value={admin.eventModal.form.title}
          autoCapitalize="sentences"
          autoFocus
          onChangeText={(v) =>
            admin.setEventModal((p: any) => ({ ...p, form: { ...p.form, title: v }, error: "" }))
          }
        />

        <FieldLabel text="Descripción (opcional)" C={C} style={{ marginTop: 14 }} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary, height: 80 }]}
          placeholder="Breve descripción del evento..."
          placeholderTextColor={C.textPlaceholder}
          value={admin.eventModal.form.description}
          multiline
          numberOfLines={3}
          onChangeText={(v) =>
            admin.setEventModal((p: any) => ({ ...p, form: { ...p.form, description: v }, error: "" }))
          }
        />

        <FieldLabel text="Fecha y hora * (AAAA-MM-DDTHH:mm)" C={C} style={{ marginTop: 14 }} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="2025-06-15T10:00"
          placeholderTextColor={C.textPlaceholder}
          value={admin.eventModal.form.event_date}
          keyboardType="default"
          autoCapitalize="none"
          onChangeText={(v) =>
            admin.setEventModal((p: any) => ({ ...p, form: { ...p.form, event_date: v }, error: "" }))
          }
        />

        <FieldLabel text="Lugar (opcional)" C={C} style={{ marginTop: 14 }} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Auditorio Central"
          placeholderTextColor={C.textPlaceholder}
          value={admin.eventModal.form.location}
          autoCapitalize="sentences"
          onChangeText={(v) =>
            admin.setEventModal((p: any) => ({ ...p, form: { ...p.form, location: v }, error: "" }))
          }
        />

        <FieldLabel text="Categoría *" C={C} style={{ marginTop: 14 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
          {(["academico", "cultural", "deportivo", "otro"] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                {
                  backgroundColor: admin.eventModal.form.category === cat ? C.primary : C.background,
                  borderColor: admin.eventModal.form.category === cat ? C.primary : C.border,
                },
              ]}
              onPress={() =>
                admin.setEventModal((p: any) => ({ ...p, form: { ...p.form, category: cat }, error: "" }))
              }
              activeOpacity={0.8}
            >
              <Text style={[
                styles.chipText,
                { color: admin.eventModal.form.category === cat ? "#fff" : C.textSecondary },
              ]}>
                {cat === "academico" ? "🎓 Académico" :
                 cat === "cultural"  ? "🎭 Cultural"  :
                 cat === "deportivo" ? "⚽ Deportivo" :
                                      "📌 Otro"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </CrudModal>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 14 },
  addBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  list: { padding: 16, gap: 8 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 13, fontWeight: "500" },
  chipSub: { fontSize: 10, marginTop: 2 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  selectionInfo: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  selectionInfoText: { fontSize: 13, fontWeight: "600" },
  // Métricas
  metricsContainer: { padding: 16, gap: 12 },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  metricIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: { fontSize: 32, fontWeight: "800" },
  metricLabel: { fontSize: 13, marginTop: 2 },
})
