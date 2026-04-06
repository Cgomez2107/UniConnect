import { FieldLabel } from "@/components/admin/CrudModal";
import { Colors } from "@/constants/Colors";
import type { EventModalState, FacultyModalState, ProgramModalState, SubjectModalState } from "@/hooks/application/useAdmin";
import { EventCategory, Faculty, Program } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface BaseProps {
  C: (typeof Colors)["light"];
}

interface FacultyFieldsProps extends BaseProps {
  modal: FacultyModalState;
  setModal: Dispatch<SetStateAction<FacultyModalState>>;
}

export function FacultyModalFields({ C, modal, setModal }: FacultyFieldsProps) {
  return (
    <>
      <FieldLabel text="Nombre de la facultad *" />
      <TextInput
        style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
        placeholder="Ej: Ingenieria"
        placeholderTextColor={C.textPlaceholder}
        value={modal.form.name}
        autoCapitalize="words"
        autoFocus
        onChangeText={(value) => setModal((p) => ({ ...p, form: { name: value }, error: "" }))}
      />
    </>
  );
}

interface ProgramFieldsProps extends BaseProps {
  modal: ProgramModalState;
  setModal: Dispatch<SetStateAction<ProgramModalState>>;
  faculties: Faculty[];
}

export function ProgramModalFields({ C, modal, setModal, faculties }: ProgramFieldsProps) {
  return (
    <>
      <FieldLabel text="Nombre del programa *" />
      <TextInput
        style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
        placeholder="Ej: Ingenieria de Sistemas"
        placeholderTextColor={C.textPlaceholder}
        value={modal.form.name}
        autoCapitalize="words"
        autoFocus
        onChangeText={(value) =>
          setModal((p) => ({ ...p, form: { ...p.form, name: value }, error: "" }))
        }
      />

      <FieldLabel text="Facultad *" style={{ marginTop: 14 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
        {faculties.map((faculty) => (
          <TouchableOpacity
            key={faculty.id}
            style={[
              styles.chip,
              {
                backgroundColor: modal.form.faculty_id === faculty.id ? C.primary : C.background,
                borderColor: modal.form.faculty_id === faculty.id ? C.primary : C.border,
              },
            ]}
            onPress={() =>
              setModal((p) => ({ ...p, form: { ...p.form, faculty_id: faculty.id }, error: "" }))
            }
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, { color: modal.form.faculty_id === faculty.id ? "#fff" : C.textSecondary }]}>
              {faculty.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

interface SubjectFieldsProps extends BaseProps {
  modal: SubjectModalState;
  setModal: Dispatch<SetStateAction<SubjectModalState>>;
  programs: Program[];
}

export function SubjectModalFields({ C, modal, setModal, programs }: SubjectFieldsProps) {
  return (
    <>
      <FieldLabel text="Nombre de la materia *" />
      <TextInput
        style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
        placeholder="Ej: Calculo Diferencial"
        placeholderTextColor={C.textPlaceholder}
        value={modal.form.name}
        autoCapitalize="words"
        autoFocus
        onChangeText={(value) => setModal((p) => ({ ...p, form: { ...p.form, name: value }, error: "" }))}
      />

      <FieldLabel text="Programas vinculados * (seleccion multiple)" style={{ marginTop: 14 }} />
      <View style={styles.chipsWrap}>
        {programs.map((program) => {
          const selected = modal.form.program_ids.includes(program.id);
          return (
            <TouchableOpacity
              key={program.id}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? C.primary : C.background,
                  borderColor: selected ? C.primary : C.border,
                },
              ]}
              onPress={() =>
                setModal((p) => ({
                  ...p,
                  form: {
                    ...p.form,
                    program_ids: selected
                      ? p.form.program_ids.filter((id) => id !== program.id)
                      : [...p.form.program_ids, program.id],
                  },
                  error: "",
                }))
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, { color: selected ? "#fff" : C.textSecondary }]}>{program.name}</Text>
              <Text style={[styles.chipSub, { color: selected ? "rgba(255,255,255,0.7)" : C.textPlaceholder }]}>
                {program.faculty_name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {modal.form.program_ids.length > 0 && (
        <View style={[styles.selectionInfo, { backgroundColor: C.primary + "12" }]}>
          <Text style={[styles.selectionInfoText, { color: C.primary }]}>
            {modal.form.program_ids.length} programa(s) seleccionado(s)
          </Text>
        </View>
      )}
    </>
  );
}

const EVENT_CATEGORIES: EventCategory[] = ["academico", "cultural", "deportivo", "otro"];

interface EventFieldsProps extends BaseProps {
  modal: EventModalState;
  setModal: Dispatch<SetStateAction<EventModalState>>;
}

export function EventModalFields({ C, modal, setModal }: EventFieldsProps) {
  return (
    <>
      <FieldLabel text="Título *" />
      <TextInput
        style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
        placeholder="Ej: Semana de la Ingeniería"
        placeholderTextColor={C.textPlaceholder}
        value={modal.form.title}
        autoCapitalize="sentences"
        autoFocus
        onChangeText={(value) => setModal((p) => ({ ...p, form: { ...p.form, title: value }, error: "" }))}
      />

      <FieldLabel text="Descripción (opcional)" style={{ marginTop: 14 }} />
      <TextInput
        style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary, height: 80 }]}
        placeholder="Breve descripción del evento..."
        placeholderTextColor={C.textPlaceholder}
        value={modal.form.description}
        multiline
        numberOfLines={3}
        onChangeText={(value) =>
          setModal((p) => ({ ...p, form: { ...p.form, description: value }, error: "" }))
        }
      />

      <FieldLabel text="Fecha y hora * (AAAA-MM-DDTHH:mm)" style={{ marginTop: 14 }} />
      <TextInput
        style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
        placeholder="2025-06-15T10:00"
        placeholderTextColor={C.textPlaceholder}
        value={modal.form.event_date}
        keyboardType="default"
        autoCapitalize="none"
        onChangeText={(value) => setModal((p) => ({ ...p, form: { ...p.form, event_date: value }, error: "" }))}
      />

      <FieldLabel text="Lugar (opcional)" style={{ marginTop: 14 }} />
      <TextInput
        style={[styles.fieldInput, { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary }]}
        placeholder="Ej: Auditorio Central"
        placeholderTextColor={C.textPlaceholder}
        value={modal.form.location}
        autoCapitalize="sentences"
        onChangeText={(value) => setModal((p) => ({ ...p, form: { ...p.form, location: value }, error: "" }))}
      />

      <FieldLabel text="Categoría *" style={{ marginTop: 14 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
        {EVENT_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.chip,
              {
                backgroundColor: modal.form.category === category ? C.primary : C.background,
                borderColor: modal.form.category === category ? C.primary : C.border,
              },
            ]}
            onPress={() => setModal((p) => ({ ...p, form: { ...p.form, category }, error: "" }))}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, { color: modal.form.category === category ? "#fff" : C.textSecondary }]}>
              {category === "academico"
                ? "🎓 Académico"
                : category === "cultural"
                  ? "🎭 Cultural"
                  : category === "deportivo"
                    ? "⚽ Deportivo"
                    : "📌 Otro"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
});
