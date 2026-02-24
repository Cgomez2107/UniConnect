/**
 * app/(admin)/index.tsx
 * Panel de administración — US-002 y US-003
 * CRUD de Facultades y Materias con tabs
 */

import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/useAuthStore";
import { Faculty, Subject } from "@/types";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Mock data (reemplazar con Supabase) ───────────────────────────────────────
const INITIAL_FACULTIES: Faculty[] = [
  { id: "f1", name: "Ingeniería" },
  { id: "f2", name: "Ciencias Exactas y Naturales" },
  { id: "f3", name: "Ciencias Jurídicas y Sociales" },
  { id: "f4", name: "Artes y Humanidades" },
  { id: "f5", name: "Ciencias Agropecuarias" },
  { id: "f6", name: "Ciencias para la Salud" },
];

const INITIAL_SUBJECTS: (Subject & { is_active: boolean })[] = [
  { id: "s1", name: "Cálculo Diferencial", faculty_id: "f1", faculty_name: "Ingeniería", is_active: true },
  { id: "s2", name: "Álgebra Lineal", faculty_id: "f1", faculty_name: "Ingeniería", is_active: true },
  { id: "s3", name: "Programación Orientada a Objetos", faculty_id: "f1", faculty_name: "Ingeniería", is_active: true },
  { id: "s4", name: "Estructuras de Datos", faculty_id: "f1", faculty_name: "Ingeniería", is_active: true },
  { id: "s5", name: "Física Mecánica", faculty_id: "f2", faculty_name: "Ciencias Exactas y Naturales", is_active: true },
  { id: "s6", name: "Estadística", faculty_id: "f2", faculty_name: "Ciencias Exactas y Naturales", is_active: true },
  { id: "s7", name: "Derecho Constitucional", faculty_id: "f3", faculty_name: "Ciencias Jurídicas y Sociales", is_active: true },
];

type ActiveTab = "facultades" | "materias";

// ── Tipos del formulario ──────────────────────────────────────────────────────
interface FacultyForm {
  name: string;
}

interface SubjectForm {
  name: string;
  faculty_id: string;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AdminPanelScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<ActiveTab>("facultades");

  // ── Estado de datos ────────────────────────────────────────────────────────
  const [faculties, setFaculties] = useState(INITIAL_FACULTIES);
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Estado de búsqueda ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");

  // ── Estado de modales ──────────────────────────────────────────────────────
  const [facultyModal, setFacultyModal] = useState<{
    visible: boolean;
    mode: "create" | "edit";
    item: Faculty | null;
    form: FacultyForm;
    error: string;
  }>({ visible: false, mode: "create", item: null, form: { name: "" }, error: "" });

  const [subjectModal, setSubjectModal] = useState<{
    visible: boolean;
    mode: "create" | "edit";
    item: (Subject & { is_active: boolean }) | null;
    form: SubjectForm;
    error: string;
  }>({ visible: false, mode: "create", item: null, form: { name: "", faculty_id: "" }, error: "" });

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filteredFaculties = useMemo(() =>
    faculties.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [faculties, search]
  );

  const filteredSubjects = useMemo(() =>
    subjects.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.faculty_name?.toLowerCase().includes(search.toLowerCase())
    ),
    [subjects, search]
  );

  // ── CRUD Facultades ────────────────────────────────────────────────────────
  const openCreateFaculty = () => {
    setFacultyModal({ visible: true, mode: "create", item: null, form: { name: "" }, error: "" });
  };

  const openEditFaculty = (item: Faculty) => {
    setFacultyModal({ visible: true, mode: "edit", item, form: { name: item.name }, error: "" });
  };

  const closeFacultyModal = () => {
    setFacultyModal(prev => ({ ...prev, visible: false }));
  };

  const saveFaculty = async () => {
    const name = facultyModal.form.name.trim();
    if (!name) {
      setFacultyModal(prev => ({ ...prev, error: "El nombre no puede estar vacío." }));
      return;
    }
    const duplicate = faculties.find(f =>
      f.name.toLowerCase() === name.toLowerCase() && f.id !== facultyModal.item?.id
    );
    if (duplicate) {
      setFacultyModal(prev => ({ ...prev, error: "Ya existe una facultad con ese nombre." }));
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 600)); // simulación

      // TODO producción:
      // if (facultyModal.mode === "create") {
      //   const { data, error } = await supabase.from("faculties").insert({ name }).select().single();
      //   if (error) throw error;
      //   setFaculties(prev => [...prev, data]);
      // } else {
      //   const { error } = await supabase.from("faculties").update({ name }).eq("id", facultyModal.item!.id);
      //   if (error) throw error;
      //   setFaculties(prev => prev.map(f => f.id === facultyModal.item!.id ? { ...f, name } : f));
      // }

      if (facultyModal.mode === "create") {
        const newId = `f${Date.now()}`;
        setFaculties(prev => [...prev, { id: newId, name }]);
      } else {
        setFaculties(prev =>
          prev.map(f => f.id === facultyModal.item!.id ? { ...f, name } : f)
        );
        // Actualizar también el nombre en materias
        setSubjects(prev =>
          prev.map(s => s.faculty_id === facultyModal.item!.id ? { ...s, faculty_name: name } : s)
        );
      }
      closeFacultyModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFaculty = (item: Faculty) => {
    const materiasCount = subjects.filter(s => s.faculty_id === item.id).length;
    Alert.alert(
      "Eliminar facultad",
      materiasCount > 0
        ? `La facultad "${item.name}" tiene ${materiasCount} materia(s) vinculada(s). ¿Estás seguro de que deseas eliminarla? Las materias también serán eliminadas.`
        : `¿Estás seguro de que deseas eliminar "${item.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            // TODO producción:
            // const { error } = await supabase.from("faculties").delete().eq("id", item.id);
            setFaculties(prev => prev.filter(f => f.id !== item.id));
            setSubjects(prev => prev.filter(s => s.faculty_id !== item.id));
          },
        },
      ]
    );
  };

  // ── CRUD Materias ──────────────────────────────────────────────────────────
  const openCreateSubject = () => {
    setSubjectModal({
      visible: true, mode: "create", item: null,
      form: { name: "", faculty_id: faculties[0]?.id ?? "" },
      error: ""
    });
  };

  const openEditSubject = (item: Subject & { is_active: boolean }) => {
    setSubjectModal({
      visible: true, mode: "edit", item,
      form: { name: item.name, faculty_id: item.faculty_id },
      error: ""
    });
  };

  const closeSubjectModal = () => {
    setSubjectModal(prev => ({ ...prev, visible: false }));
  };

  const saveSubject = async () => {
    const name = subjectModal.form.name.trim();
    const faculty_id = subjectModal.form.faculty_id;

    if (!name) {
      setSubjectModal(prev => ({ ...prev, error: "El nombre no puede estar vacío." }));
      return;
    }
    if (!faculty_id) {
      setSubjectModal(prev => ({ ...prev, error: "Selecciona una facultad." }));
      return;
    }
    const duplicate = subjects.find(s =>
      s.name.toLowerCase() === name.toLowerCase() &&
      s.faculty_id === faculty_id &&
      s.id !== subjectModal.item?.id
    );
    if (duplicate) {
      setSubjectModal(prev => ({ ...prev, error: "Ya existe esa materia en esa facultad." }));
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 600));

      // TODO producción:
      // const facultyName = faculties.find(f => f.id === faculty_id)?.name ?? "";
      // if (subjectModal.mode === "create") {
      //   const { data, error } = await supabase.from("subjects")
      //     .insert({ name, faculty_id }).select().single();
      //   if (error) throw error;
      //   setSubjects(prev => [...prev, { ...data, faculty_name: facultyName, is_active: true }]);
      // } else {
      //   const { error } = await supabase.from("subjects")
      //     .update({ name, faculty_id }).eq("id", subjectModal.item!.id);
      //   if (error) throw error;
      //   setSubjects(prev => prev.map(s => s.id === subjectModal.item!.id
      //     ? { ...s, name, faculty_id, faculty_name: facultyName } : s));
      // }

      const facultyName = faculties.find(f => f.id === faculty_id)?.name ?? "";
      if (subjectModal.mode === "create") {
        setSubjects(prev => [...prev, {
          id: `s${Date.now()}`, name, faculty_id,
          faculty_name: facultyName, is_active: true
        }]);
      } else {
        setSubjects(prev => prev.map(s => s.id === subjectModal.item!.id
          ? { ...s, name, faculty_id, faculty_name: facultyName } : s));
      }
      closeSubjectModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSubject = (item: Subject) => {
    Alert.alert(
      "Eliminar materia",
      `¿Estás seguro de que deseas eliminar "${item.name}"?\n\nLas solicitudes de estudio vinculadas a esta materia también se verán afectadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            // TODO: await supabase.from("subjects").delete().eq("id", item.id);
            setSubjects(prev => prev.filter(s => s.id !== item.id));
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir del panel?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: async () => {
        await signOut();
        router.replace("/login");
      }},
    ]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* ── Header del panel ────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSub}>Hola, {user?.fullName?.split(" ")[0]} ⚙️</Text>
        </View>
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: "rgba(255,255,255,0.4)" }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <View style={[styles.tabsRow, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        {(["facultades", "materias"] as ActiveTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && [styles.tabActive, { borderBottomColor: C.primary }]
            ]}
            onPress={() => { setActiveTab(tab); setSearch(""); }}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? C.primary : C.textSecondary }
            ]}>
              {tab === "facultades" ? "🏛️  Facultades" : "📚  Materias"}
            </Text>
            <View style={[
              styles.tabCountBadge,
              { backgroundColor: activeTab === tab ? C.primary + "20" : C.border }
            ]}>
              <Text style={[
                styles.tabCountText,
                { color: activeTab === tab ? C.primary : C.textSecondary }
              ]}>
                {tab === "facultades" ? faculties.length : subjects.length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Buscador ────────────────────────────────────────────────────── */}
      <View style={[styles.searchRow, { borderBottomColor: C.border }]}>
        <View style={[styles.searchBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={{ color: C.textPlaceholder, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: C.textPrimary }]}
            placeholder={activeTab === "facultades" ? "Buscar facultad..." : "Buscar materia o facultad..."}
            placeholderTextColor={C.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: C.textSecondary, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón agregar */}
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: C.primary }]}
          onPress={activeTab === "facultades" ? openCreateFaculty : openCreateSubject}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* ── Lista ────────────────────────────────────────────────────────── */}
      {activeTab === "facultades" ? (
        <FlatList
          data={filteredFaculties}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FacultyRow
              item={item}
              index={index}
              materiasCount={subjects.filter(s => s.faculty_id === item.id).length}
              onEdit={() => openEditFaculty(item)}
              onDelete={() => deleteFaculty(item)}
              C={C}
            />
          )}
          ListEmptyComponent={<EmptyState label="No hay facultades" C={C} />}
        />
      ) : (
        <FlatList
          data={filteredSubjects}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SubjectRow
              item={item}
              onEdit={() => openEditSubject(item)}
              onDelete={() => deleteSubject(item)}
              C={C}
            />
          )}
          ListEmptyComponent={<EmptyState label="No hay materias" C={C} />}
        />
      )}

      {/* ── Modal Facultad ───────────────────────────────────────────────── */}
      <CrudModal
        visible={facultyModal.visible}
        title={facultyModal.mode === "create" ? "Nueva facultad" : "Editar facultad"}
        error={facultyModal.error}
        isSubmitting={isSubmitting}
        onClose={closeFacultyModal}
        onSave={saveFaculty}
        C={C}
      >
        <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>
          Nombre de la facultad *
        </Text>
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Ingeniería"
          placeholderTextColor={C.textPlaceholder}
          value={facultyModal.form.name}
          onChangeText={v => setFacultyModal(prev => ({ ...prev, form: { name: v }, error: "" }))}
          autoCapitalize="words"
          autoFocus
        />
      </CrudModal>

      {/* ── Modal Materia ────────────────────────────────────────────────── */}
      <CrudModal
        visible={subjectModal.visible}
        title={subjectModal.mode === "create" ? "Nueva materia" : "Editar materia"}
        error={subjectModal.error}
        isSubmitting={isSubmitting}
        onClose={closeSubjectModal}
        onSave={saveSubject}
        C={C}
      >
        <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>
          Nombre de la materia *
        </Text>
        <TextInput
          style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
          placeholder="Ej: Cálculo Diferencial"
          placeholderTextColor={C.textPlaceholder}
          value={subjectModal.form.name}
          onChangeText={v => setSubjectModal(prev => ({ ...prev, form: { ...prev.form, name: v }, error: "" }))}
          autoCapitalize="words"
          autoFocus
        />

        <Text style={[styles.fieldLabel, { color: C.textSecondary, marginTop: 14 }]}>
          Facultad *
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.facultyChipsScroll}
        >
          {faculties.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.facultyChip,
                {
                  backgroundColor: subjectModal.form.faculty_id === f.id ? C.primary : C.background,
                  borderColor: subjectModal.form.faculty_id === f.id ? C.primary : C.border,
                }
              ]}
              onPress={() => setSubjectModal(prev => ({
                ...prev, form: { ...prev.form, faculty_id: f.id }, error: ""
              }))}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.facultyChipText,
                { color: subjectModal.form.faculty_id === f.id ? "#fff" : C.textSecondary }
              ]}>
                {f.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </CrudModal>
    </View>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function FacultyRow({ item, index, materiasCount, onEdit, onDelete, C }: {
  item: Faculty; index: number; materiasCount: number;
  onEdit: () => void; onDelete: () => void;
  C: (typeof Colors)["light"];
}) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.rowIndex, { backgroundColor: C.primary + "15" }]}>
        <Text style={[styles.rowIndexText, { color: C.primary }]}>{index + 1}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: C.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.rowMeta, { color: C.textSecondary }]}>
          {materiasCount} materia{materiasCount !== 1 ? "s" : ""} vinculada{materiasCount !== 1 ? "s" : ""}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
          onPress={onEdit}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: C.primary }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: C.errorBackground }]}
          onPress={onDelete}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: C.error }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SubjectRow({ item, onEdit, onDelete, C }: {
  item: Subject & { is_active: boolean };
  onEdit: () => void; onDelete: () => void;
  C: (typeof Colors)["light"];
}) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: C.textPrimary }]}>{item.name}</Text>
        <View style={[styles.facultyTag, { backgroundColor: C.primary + "12" }]}>
          <Text style={[styles.facultyTagText, { color: C.primary }]}>
            {item.faculty_name}
          </Text>
        </View>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
          onPress={onEdit}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: C.primary }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: C.errorBackground }]}
          onPress={onDelete}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: C.error }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CrudModal({ visible, title, error, isSubmitting, onClose, onSave, children, C }: {
  visible: boolean; title: string; error: string; isSubmitting: boolean;
  onClose: () => void; onSave: () => void;
  children: React.ReactNode;
  C: (typeof Colors)["light"];
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
          <View
            style={[styles.modalSheet, { backgroundColor: C.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHandle, { backgroundColor: C.border }]} />

            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>{title}</Text>

            {error ? (
              <View style={[styles.modalError, { backgroundColor: C.errorBackground, borderColor: C.borderError }]}>
                <Text style={[styles.modalErrorText, { color: C.error }]}>{error}</Text>
              </View>
            ) : null}

            {children}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: C.border }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: C.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: C.primary }]}
                onPress={onSave}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalSaveText}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmptyState({ label, C }: { label: string; C: (typeof Colors)["light"] }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={[styles.emptyText, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  signOutBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  signOutText: { fontSize: 13, color: "#fff", fontWeight: "500" },

  // Tabs
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, gap: 8, borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: "600" },
  tabCountBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
  },
  tabCountText: { fontSize: 11, fontWeight: "700" },

  // Search
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 10, borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 14 },
  addBtn: {
    paddingHorizontal: 16, height: 40, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Lista
  listContent: { padding: 16, paddingBottom: 80, gap: 10 },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1, borderRadius: 10,
    padding: 12, gap: 12,
  },
  rowIndex: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  rowIndexText: { fontSize: 13, fontWeight: "700" },
  rowInfo: { flex: 1, gap: 4 },
  rowName: { fontSize: 14, fontWeight: "600" },
  rowMeta: { fontSize: 12 },
  facultyTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  facultyTagText: { fontSize: 11, fontWeight: "600" },
  rowActions: { flexDirection: "row", gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { fontSize: 12, fontWeight: "600" },

  // Empty
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "#00000055", justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalError: {
    borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12,
  },
  modalErrorText: { fontSize: 13 },
  fieldLabel: { fontSize: 13, fontWeight: "500", marginBottom: 8 },
  fieldInput: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 14, height: 48, fontSize: 15,
  },
  facultyChipsScroll: { marginTop: 2 },
  facultyChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, marginRight: 8,
  },
  facultyChipText: { fontSize: 13, fontWeight: "500" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  modalCancelBtn: {
    flex: 1, height: 48, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  modalCancelText: { fontSize: 14, fontWeight: "600" },
  modalSaveBtn: {
    flex: 2, height: 48, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  modalSaveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});