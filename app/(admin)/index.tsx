/**
 * app/(admin)/index.tsx
 * Panel de administración — US-002 y US-003
 * 3 tabs: Facultades → Programas → Materias
 * Conectado a Supabase real via facultyService
 */

import { Colors } from "@/constants/Colors";
import {
  createFaculty, createProgram, createSubject,
  getFaculties, getPrograms, getSubjects,
  deleteFaculty as sbDeleteFaculty,
  deleteProgram as sbDeleteProgram,
  deleteSubject as sbDeleteSubject,
  updateFaculty, updateProgram, updateSubject,
} from "@/lib/services/facultyService";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, useColorScheme, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Tipos locales ─────────────────────────────────────────────────────────────
interface Faculty  { id: string; name: string; }
interface Program  { id: string; name: string; faculty_id: string; faculty_name?: string; }
interface Subject  { id: string; name: string; is_active?: boolean; programs?: Program[]; }

type ActiveTab = "facultades" | "programas" | "materias";

// ── Componente principal ──────────────────────────────────────────────────────
export default function AdminPanelScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const user    = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const insets  = useSafeAreaInsets();

  const [activeTab,    setActiveTab]    = useState<ActiveTab>("facultades");
  const [search,       setSearch]       = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);

  // ── Datos desde Supabase ───────────────────────────────────────────────────
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs,  setPrograms]  = useState<Program[]>([]);
  const [subjects,  setSubjects]  = useState<Subject[]>([]);

  // Carga inicial de todas las tablas en paralelo
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [facs, progs, subs] = await Promise.all([
          getFaculties(),
          getPrograms(),
          getSubjects(),
        ]);
        setFaculties(facs);
        setPrograms(progs as Program[]);
        setSubjects(subs as Subject[]);
      } catch (e: any) {
        Alert.alert("Error", "No se pudieron cargar los datos: " + e.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Modales ────────────────────────────────────────────────────────────────
  const [facultyModal, setFacultyModal] = useState<{
    visible: boolean; mode: "create"|"edit"; item: Faculty|null;
    form: { name: string }; error: string;
  }>({ visible: false, mode: "create", item: null, form: { name: "" }, error: "" });

  const [programModal, setProgramModal] = useState<{
    visible: boolean; mode: "create"|"edit"; item: Program|null;
    form: { name: string; faculty_id: string }; error: string;
  }>({ visible: false, mode: "create", item: null, form: { name: "", faculty_id: "" }, error: "" });

  const [subjectModal, setSubjectModal] = useState<{
    visible: boolean; mode: "create"|"edit"; item: Subject|null;
    form: { name: string; program_ids: string[] }; error: string;
  }>({ visible: false, mode: "create", item: null, form: { name: "", program_ids: [] }, error: "" });

  // ── Filtrados ──────────────────────────────────────────────────────────────
  const filteredFaculties = useMemo(() =>
    faculties.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [faculties, search]);

  const filteredPrograms = useMemo(() => {
    const q = search.toLowerCase();
    return programs.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.faculty_name ?? "").toLowerCase().includes(q)
    );
  }, [programs, search]);

  const filteredSubjects = useMemo(() =>
    subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [subjects, search]);

  // Helpers de conteo (derivados del estado, sin tabla intermedia local)
  const programsCountForFaculty = (fid: string) =>
    programs.filter(p => p.faculty_id === fid).length;

  const subjectsCountForProgram = (pid: string) =>
    subjects.filter(s => s.programs?.some(p => p.id === pid)).length;

  const programsForSubject = (sid: string) =>
    subjects.find(s => s.id === sid)?.programs ?? [];

  // ── CRUD Facultades ────────────────────────────────────────────────────────
  const saveFaculty = async () => {
    const name = facultyModal.form.name.trim();
    if (!name) return setFacultyModal(p => ({ ...p, error: "El nombre no puede estar vacío." }));
    if (faculties.find(f => f.name.toLowerCase() === name.toLowerCase() && f.id !== facultyModal.item?.id))
      return setFacultyModal(p => ({ ...p, error: "Ya existe una facultad con ese nombre." }));

    setIsSubmitting(true);
    try {
      if (facultyModal.mode === "create") {
        const nueva = await createFaculty(name);
        setFaculties(p => [...p, nueva]);
      } else {
        const actualizada = await updateFaculty(facultyModal.item!.id, { name });
        setFaculties(p => p.map(f => f.id === actualizada.id ? actualizada : f));
        // Actualizar nombre en programas (solo local, ya viene del join en próxima carga)
        setPrograms(p => p.map(pr =>
          pr.faculty_id === facultyModal.item!.id ? { ...pr, faculty_name: name } : pr
        ));
      }
      setFacultyModal(p => ({ ...p, visible: false }));
    } catch (e: any) {
      setFacultyModal(p => ({ ...p, error: e.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFaculty = (item: Faculty) => {
    const count = programs.filter(p => p.faculty_id === item.id).length;
    Alert.alert(
      "Eliminar facultad",
      count > 0
        ? `"${item.name}" tiene ${count} programa(s) vinculado(s). Al eliminarla también se eliminarán sus programas.`
        : `¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`,
      [{ text: "Cancelar", style: "cancel" },
       { text: "Eliminar", style: "destructive", onPress: async () => {
          try {
            await sbDeleteFaculty(item.id);
            const progIds = programs.filter(p => p.faculty_id === item.id).map(p => p.id);
            setFaculties(p => p.filter(f => f.id !== item.id));
            setPrograms(p => p.filter(p => p.faculty_id !== item.id));
            // Limpiar programas de las materias que pertenecían a esos programas
            setSubjects(p => p.map(s => ({
              ...s,
              programs: s.programs?.filter(pr => !progIds.includes(pr.id))
            })));
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
       }}]
    );
  };

  // ── CRUD Programas ─────────────────────────────────────────────────────────
  const saveProgram = async () => {
    const name       = programModal.form.name.trim();
    const faculty_id = programModal.form.faculty_id;
    if (!name)       return setProgramModal(p => ({ ...p, error: "El nombre no puede estar vacío." }));
    if (!faculty_id) return setProgramModal(p => ({ ...p, error: "Selecciona una facultad." }));
    if (programs.find(p => p.name.toLowerCase() === name.toLowerCase()
        && p.faculty_id === faculty_id && p.id !== programModal.item?.id))
      return setProgramModal(p => ({ ...p, error: "Ya existe ese programa en esa facultad." }));

    setIsSubmitting(true);
    try {
      const faculty_name = faculties.find(f => f.id === faculty_id)?.name ?? "";
      if (programModal.mode === "create") {
        const nuevo = await createProgram(name, faculty_id);
        setPrograms(p => [...p, { ...nuevo, faculty_name }]);
      } else {
        const actualizado = await updateProgram(programModal.item!.id, { name, faculty_id });
        setPrograms(p => p.map(pr =>
          pr.id === actualizado.id ? { ...actualizado, faculty_name } : pr
        ));
      }
      setProgramModal(p => ({ ...p, visible: false }));
    } catch (e: any) {
      setProgramModal(p => ({ ...p, error: e.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProgram = (item: Program) => {
    const count = subjectsCountForProgram(item.id);
    Alert.alert(
      "Eliminar programa",
      count > 0
        ? `"${item.name}" tiene ${count} materia(s) vinculada(s). Se eliminarán los vínculos.`
        : `¿Eliminar "${item.name}"?`,
      [{ text: "Cancelar", style: "cancel" },
       { text: "Eliminar", style: "destructive", onPress: async () => {
          try {
            await sbDeleteProgram(item.id);
            setPrograms(p => p.filter(p => p.id !== item.id));
            setSubjects(p => p.map(s => ({
              ...s,
              programs: s.programs?.filter(pr => pr.id !== item.id)
            })));
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
       }}]
    );
  };

  // ── CRUD Materias ──────────────────────────────────────────────────────────
  const saveSubject = async () => {
    const name        = subjectModal.form.name.trim();
    const program_ids = subjectModal.form.program_ids;
    if (!name) return setSubjectModal(p => ({ ...p, error: "El nombre no puede estar vacío." }));
    if (program_ids.length === 0)
      return setSubjectModal(p => ({ ...p, error: "Vincula al menos un programa." }));
    if (subjects.find(s => s.name.toLowerCase() === name.toLowerCase() && s.id !== subjectModal.item?.id))
      return setSubjectModal(p => ({ ...p, error: "Ya existe una materia con ese nombre." }));

    setIsSubmitting(true);
    try {
      const linkedPrograms = programs.filter(p => program_ids.includes(p.id));
      if (subjectModal.mode === "create") {
        const nueva = await createSubject(name, program_ids);
        setSubjects(p => [...p, { ...nueva, programs: linkedPrograms }]);
      } else {
        const actualizada = await updateSubject(
          subjectModal.item!.id, { name }, program_ids
        );
        setSubjects(p => p.map(s =>
          s.id === actualizada.id ? { ...actualizada, programs: linkedPrograms } : s
        ));
      }
      setSubjectModal(p => ({ ...p, visible: false }));
    } catch (e: any) {
      setSubjectModal(p => ({ ...p, error: e.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSubject = (item: Subject) => {
    Alert.alert(
      "Eliminar materia",
      `¿Eliminar "${item.name}"?\n\nLas solicitudes de estudio vinculadas también se verán afectadas.`,
      [{ text: "Cancelar", style: "cancel" },
       { text: "Eliminar", style: "destructive", onPress: async () => {
          try {
            await sbDeleteSubject(item.id);
            setSubjects(p => p.filter(s => s.id !== item.id));
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
       }}]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: async () => {
        await signOut(); router.replace("/login");
      }},
    ]);
  };

  const TABS: { key: ActiveTab; emoji: string; label: string; count: number }[] = [
    { key: "facultades", emoji: "🏛️", label: "Facultades", count: faculties.length },
    { key: "programas",  emoji: "🎓", label: "Programas",  count: programs.length  },
    { key: "materias",   emoji: "📚", label: "Materias",   count: subjects.length  },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSub}>Hola, {user?.fullName?.split(" ")[0]} ⚙️</Text>
        </View>
        <TouchableOpacity style={[styles.signOutBtn, { borderColor: "rgba(255,255,255,0.4)" }]}
          onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.key}
            style={[styles.tab, activeTab === tab.key && [styles.tabActive, { borderBottomColor: C.primary }]]}
            onPress={() => { setActiveTab(tab.key); setSearch(""); }} activeOpacity={0.8}>
            <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
            <Text style={[styles.tabText, { color: activeTab === tab.key ? C.primary : C.textSecondary }]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.key ? C.primary + "20" : C.border }]}>
              <Text style={[styles.tabBadgeText, { color: activeTab === tab.key ? C.primary : C.textSecondary }]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buscador + botón nuevo */}
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
            value={search} onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: C.textSecondary, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: C.primary }]}
          onPress={() => {
            if (activeTab === "facultades") {
              setFacultyModal({ visible: true, mode: "create", item: null, form: { name: "" }, error: "" });
            } else if (activeTab === "programas") {
              setProgramModal({ visible: true, mode: "create", item: null,
                form: { name: "", faculty_id: faculties[0]?.id ?? "" }, error: "" });
            } else {
              setSubjectModal({ visible: true, mode: "create", item: null,
                form: { name: "", program_ids: [] }, error: "" });
            }
          }} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>Cargando datos...</Text>
        </View>
      ) : (
        <>
          {/* Lista Facultades */}
          {activeTab === "facultades" && (
            <FlatList
              data={filteredFaculties} keyExtractor={i => i.id}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <FacultyRow item={item} index={index}
                  programsCount={programsCountForFaculty(item.id)}
                  onEdit={() => setFacultyModal({ visible: true, mode: "edit", item,
                    form: { name: item.name }, error: "" })}
                  onDelete={() => deleteFaculty(item)} C={C} />
              )}
              ListEmptyComponent={<EmptyState label="No hay facultades" C={C} />}
            />
          )}

          {/* Lista Programas */}
          {activeTab === "programas" && (
            <FlatList
              data={filteredPrograms} keyExtractor={i => i.id}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <ProgramRow item={item} index={index}
                  subjectsCount={subjectsCountForProgram(item.id)}
                  onEdit={() => setProgramModal({ visible: true, mode: "edit", item,
                    form: { name: item.name, faculty_id: item.faculty_id }, error: "" })}
                  onDelete={() => deleteProgram(item)} C={C} />
              )}
              ListEmptyComponent={<EmptyState label="No hay programas" C={C} />}
            />
          )}

          {/* Lista Materias */}
          {activeTab === "materias" && (
            <FlatList
              data={filteredSubjects} keyExtractor={i => i.id}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <SubjectRow item={item}
                  programs={programsForSubject(item.id)}
                  onEdit={() => {
                    const currentProgIds = (item.programs ?? []).map(p => p.id);
                    setSubjectModal({ visible: true, mode: "edit", item,
                      form: { name: item.name, program_ids: currentProgIds }, error: "" });
                  }}
                  onDelete={() => deleteSubject(item)} C={C} />
              )}
              ListEmptyComponent={<EmptyState label="No hay materias" C={C} />}
            />
          )}
        </>
      )}

      {/* Modal Facultad */}
      <CrudModal visible={facultyModal.visible}
        title={facultyModal.mode === "create" ? "Nueva facultad" : "Editar facultad"}
        error={facultyModal.error} isSubmitting={isSubmitting}
        onClose={() => setFacultyModal(p => ({ ...p, visible: false }))}
        onSave={saveFaculty} C={C}>
        <FieldLabel text="Nombre de la facultad *" C={C} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Ingeniería" placeholderTextColor={C.textPlaceholder}
          value={facultyModal.form.name} autoCapitalize="words" autoFocus
          onChangeText={v => setFacultyModal(p => ({ ...p, form: { name: v }, error: "" }))}
        />
      </CrudModal>

      {/* Modal Programa */}
      <CrudModal visible={programModal.visible}
        title={programModal.mode === "create" ? "Nuevo programa" : "Editar programa"}
        error={programModal.error} isSubmitting={isSubmitting}
        onClose={() => setProgramModal(p => ({ ...p, visible: false }))}
        onSave={saveProgram} C={C}>
        <FieldLabel text="Nombre del programa *" C={C} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Ingeniería de Sistemas" placeholderTextColor={C.textPlaceholder}
          value={programModal.form.name} autoCapitalize="words" autoFocus
          onChangeText={v => setProgramModal(p => ({ ...p, form: { ...p.form, name: v }, error: "" }))}
        />
        <FieldLabel text="Facultad *" C={C} style={{ marginTop: 14 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
          {faculties.map(f => (
            <TouchableOpacity key={f.id}
              style={[styles.chip, {
                backgroundColor: programModal.form.faculty_id === f.id ? C.primary : C.background,
                borderColor:     programModal.form.faculty_id === f.id ? C.primary : C.border,
              }]}
              onPress={() => setProgramModal(p => ({ ...p, form: { ...p.form, faculty_id: f.id }, error: "" }))}
              activeOpacity={0.8}>
              <Text style={[styles.chipText, { color: programModal.form.faculty_id === f.id ? "#fff" : C.textSecondary }]}>
                {f.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </CrudModal>

      {/* Modal Materia */}
      <CrudModal visible={subjectModal.visible}
        title={subjectModal.mode === "create" ? "Nueva materia" : "Editar materia"}
        error={subjectModal.error} isSubmitting={isSubmitting}
        onClose={() => setSubjectModal(p => ({ ...p, visible: false }))}
        onSave={saveSubject} C={C}>
        <FieldLabel text="Nombre de la materia *" C={C} />
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Cálculo Diferencial" placeholderTextColor={C.textPlaceholder}
          value={subjectModal.form.name} autoCapitalize="words" autoFocus
          onChangeText={v => setSubjectModal(p => ({ ...p, form: { ...p.form, name: v }, error: "" }))}
        />
        <FieldLabel text="Programas vinculados * (selección múltiple)" C={C} style={{ marginTop: 14 }} />
        <View style={styles.chipsWrap}>
          {programs.map(prog => {
            const selected  = subjectModal.form.program_ids.includes(prog.id);
            const facName   = prog.faculty_name ?? "";
            return (
              <TouchableOpacity key={prog.id}
                style={[styles.chip, {
                  backgroundColor: selected ? C.primary : C.background,
                  borderColor:     selected ? C.primary : C.border,
                }]}
                onPress={() => setSubjectModal(p => ({
                  ...p,
                  form: { ...p.form, program_ids: selected
                    ? p.form.program_ids.filter(id => id !== prog.id)
                    : [...p.form.program_ids, prog.id]
                  }, error: ""
                }))} activeOpacity={0.8}>
                <Text style={[styles.chipText, { color: selected ? "#fff" : C.textSecondary }]}>
                  {prog.name}
                </Text>
                <Text style={[styles.chipSubText, { color: selected ? "rgba(255,255,255,0.7)" : C.textPlaceholder }]}>
                  {facName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {subjectModal.form.program_ids.length > 0 && (
          <View style={[styles.selectionInfo, { backgroundColor: C.primary + "12" }]}>
            <Text style={[styles.selectionInfoText, { color: C.primary }]}>
              ✓ {subjectModal.form.program_ids.length} programa(s) seleccionado(s)
            </Text>
          </View>
        )}
      </CrudModal>
    </View>
  );
}

// ── Subcomponentes — sin cambios vs versión anterior ──────────────────────────
function FacultyRow({ item, index, programsCount, onEdit, onDelete, C }: {
  item: Faculty; index: number; programsCount: number;
  onEdit: () => void; onDelete: () => void; C: typeof Colors["light"];
}) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.rowIndex, { backgroundColor: C.primary + "15" }]}>
        <Text style={[styles.rowIndexText, { color: C.primary }]}>{index + 1}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: C.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.rowMeta, { color: C.textSecondary }]}>
          {programsCount} programa{programsCount !== 1 ? "s" : ""}
        </Text>
      </View>
      <RowActions onEdit={onEdit} onDelete={onDelete} C={C} />
    </View>
  );
}

function ProgramRow({ item, index, subjectsCount, onEdit, onDelete, C }: {
  item: Program & { faculty_name?: string }; index: number; subjectsCount: number;
  onEdit: () => void; onDelete: () => void; C: typeof Colors["light"];
}) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.rowIndex, { backgroundColor: C.accent + "30" }]}>
        <Text style={[styles.rowIndexText, { color: C.accentDark }]}>{index + 1}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: C.textPrimary }]}>{item.name}</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
          <View style={[styles.tag, { backgroundColor: C.primary + "12" }]}>
            <Text style={[styles.tagText, { color: C.primary }]}>{item.faculty_name}</Text>
          </View>
          <Text style={[styles.rowMeta, { color: C.textSecondary }]}>
            {subjectsCount} materia{subjectsCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <RowActions onEdit={onEdit} onDelete={onDelete} C={C} />
    </View>
  );
}

function SubjectRow({ item, programs, onEdit, onDelete, C }: {
  item: Subject; programs: Program[];
  onEdit: () => void; onDelete: () => void; C: typeof Colors["light"];
}) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: C.textPrimary }]}>{item.name}</Text>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {programs.length === 0
            ? <Text style={[styles.rowMeta, { color: C.textPlaceholder }]}>Sin programas vinculados</Text>
            : programs.map(p => (
                <View key={p.id} style={[styles.tag, { backgroundColor: C.primary + "12" }]}>
                  <Text style={[styles.tagText, { color: C.primary }]}>{p.name}</Text>
                </View>
              ))
          }
        </View>
      </View>
      <RowActions onEdit={onEdit} onDelete={onDelete} C={C} />
    </View>
  );
}

function RowActions({ onEdit, onDelete, C }: {
  onEdit: () => void; onDelete: () => void; C: typeof Colors["light"];
}) {
  return (
    <View style={styles.rowActions}>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
        onPress={onEdit} activeOpacity={0.8}>
        <Text style={[styles.actionBtnText, { color: C.primary }]}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.errorBackground }]}
        onPress={onDelete} activeOpacity={0.8}>
        <Text style={[styles.actionBtnText, { color: C.error }]}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

function FieldLabel({ text, C, style }: { text: string; C: typeof Colors["light"]; style?: any }) {
  return (
    <Text style={[{ fontSize: 13, fontWeight: "500", marginBottom: 8, color: C.textSecondary }, style]}>
      {text}
    </Text>
  );
}

function CrudModal({ visible, title, error, isSubmitting, onClose, onSave, children, C }: {
  visible: boolean; title: string; error: string; isSubmitting: boolean;
  onClose: () => void; onSave: () => void; children: React.ReactNode;
  C: typeof Colors["light"];
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
          <View style={[styles.modalSheet, { backgroundColor: C.surface }]}
            onStartShouldSetResponder={() => true}>
            <View style={[styles.modalHandle, { backgroundColor: C.border }]} />
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>{title}</Text>
            {!!error && (
              <View style={[styles.modalError, { backgroundColor: C.errorBackground, borderColor: C.borderError }]}>
                <Text style={{ fontSize: 13, color: C.error }}>{error}</Text>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: C.border }]}
                onPress={onClose} activeOpacity={0.8}>
                <Text style={[styles.modalCancelText, { color: C.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: C.primary }]}
                onPress={onSave} disabled={isSubmitting} activeOpacity={0.85}>
                {isSubmitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalSaveText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmptyState({ label, C }: { label: string; C: typeof Colors["light"] }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 36 }}>📭</Text>
      <Text style={[{ fontSize: 14 }, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ── Estilos — sin cambios ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  signOutBtn:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  signOutText: { fontSize: 13, color: "#fff", fontWeight: "500" },

  tabsRow: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, gap: 5, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: {},
  tabText:  { fontSize: 12, fontWeight: "600" },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tabBadgeText: { fontSize: 10, fontWeight: "700" },

  searchRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 1 },
  searchBox:  { flex: 1, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14 },
  addBtn:  { paddingHorizontal: 16, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },

  listContent: { padding: 16, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 12, gap: 12 },
  rowIndex: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowIndexText: { fontSize: 13, fontWeight: "700" },
  rowInfo:  { flex: 1, gap: 2 },
  rowName:  { fontSize: 14, fontWeight: "600" },
  rowMeta:  { fontSize: 12 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tagText: { fontSize: 11, fontWeight: "600" },
  rowActions: { flexDirection: "row", gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { fontSize: 12, fontWeight: "600" },

  empty: { alignItems: "center", paddingTop: 60, gap: 10 },

  modalOverlay: { flex: 1, backgroundColor: "#00000055", justifyContent: "flex-end" },
  modalSheet:   { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: "85%" },
  modalHandle:  { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle:   { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalError:   { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
  fieldInput:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, height: 48, fontSize: 15 },

  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  chipText:    { fontSize: 13, fontWeight: "500" },
  chipSubText: { fontSize: 10, marginTop: 2 },
  chipsWrap:   { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },

  selectionInfo: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  selectionInfoText: { fontSize: 13, fontWeight: "600" },

  modalActions:    { flexDirection: "row", gap: 12, marginTop: 20 },
  modalCancelBtn:  { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalCancelText: { fontSize: 14, fontWeight: "600" },
  modalSaveBtn:    { flex: 2, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalSaveText:   { color: "#fff", fontSize: 14, fontWeight: "700" },
});