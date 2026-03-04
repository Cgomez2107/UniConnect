/**
 * app/(admin)/index.tsx
 * Panel de administración — US-002 y US-003
 * 3 tabs: Facultades → Programas → Materias
 *
 * Refactorizado: de 731 líneas a ~190.
 * Toda la lógica CRUD vive en hooks/useAdmin.ts
 * Los subcomponentes están en components/admin/
 */

import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminTabs, type ActiveTab } from "@/components/admin/AdminTabs"
import { CrudModal, FieldLabel } from "@/components/admin/CrudModal"
import { FacultyRow, ProgramRow, RowActions, SubjectRow } from "@/components/admin/CatalogRow"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingState } from "@/components/shared/LoadingState"
import { Colors } from "@/constants/Colors"
import { useAdmin } from "@/hooks/useAdmin"
import { useAuthStore } from "@/store/useAuthStore"
import { router } from "expo-router"
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

  // ── Tabs config ────────────────────────────────────────────────────────────
  const TABS = [
    { key: "facultades" as ActiveTab, emoji: "🏛️", label: "Facultades", count: admin.faculties.length },
    { key: "programas"  as ActiveTab, emoji: "🎓", label: "Programas",  count: admin.programs.length  },
    { key: "materias"   as ActiveTab, emoji: "📚", label: "Materias",   count: admin.subjects.length  },
  ]

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
    } else {
      admin.openCreateSubject()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
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

      {/* Buscador + boton nuevo */}
      <View style={[styles.searchRow, { borderBottomColor: C.border }]}>
        <View style={[styles.searchBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={{ color: C.textPlaceholder, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: C.textPrimary }]}
            placeholder={
              activeTab === "facultades" ? "Buscar facultad..." :
              activeTab === "programas"  ? "Buscar programa o facultad..." :
              "Buscar materia..."
            }
            placeholderTextColor={C.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: C.textSecondary, fontSize: 18 }}>x</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: C.primary }]}
          onPress={handleAddPress}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

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
              ListEmptyComponent={<EmptyState emoji="📭" title="No hay facultades" body="" />}
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
              ListEmptyComponent={<EmptyState emoji="📭" title="No hay programas" body="" />}
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
                  programs={admin.programsForSubject(item.id) as any}
                  onEdit={() => admin.openEditSubject(item)}
                  onDelete={() => admin.deleteSubject(item)}
                  C={C}
                />
              )}
              ListEmptyComponent={<EmptyState emoji="📭" title="No hay materias" body="" />}
            />
          )}
        </>
      )}

      {/* ── Modal Facultad ────────────────────────────────────────────────── */}
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
            admin.setFacultyModal((p) => ({ ...p, form: { name: v }, error: "" }))
          }
        />
      </CrudModal>

      {/* ── Modal Programa ────────────────────────────────────────────────── */}
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
            admin.setProgramModal((p) => ({ ...p, form: { ...p.form, name: v }, error: "" }))
          }
        />
        <FieldLabel text="Facultad *" C={C} style={{ marginTop: 14 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
          {admin.faculties.map((f) => (
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
                admin.setProgramModal((p) => ({ ...p, form: { ...p.form, faculty_id: f.id }, error: "" }))
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

      {/* ── Modal Materia ─────────────────────────────────────────────────── */}
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
            admin.setSubjectModal((p) => ({ ...p, form: { ...p.form, name: v }, error: "" }))
          }
        />
        <FieldLabel text="Programas vinculados * (seleccion multiple)" C={C} style={{ marginTop: 14 }} />
        <View style={styles.chipsWrap}>
          {admin.programs.map((prog) => {
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
                  admin.setSubjectModal((p) => ({
                    ...p,
                    form: {
                      ...p.form,
                      program_ids: selected
                        ? p.form.program_ids.filter((id) => id !== prog.id)
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
})
