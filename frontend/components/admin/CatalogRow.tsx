/**
 * components/admin/CatalogRow.tsx
 * Filas de lista para el panel admin: Facultad, Programa y Materia.
 * Separadas del inline del antiguo index.tsx (731 líneas).
 */

import { Colors } from "@/constants/Colors"
import type { Faculty, Program, Subject } from "@/types"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

// ── Acciones (Editar / Eliminar) ──────────────────────────────────────────────

interface RowActionsProps {
  onEdit: () => void
  onDelete: () => void
  C: typeof Colors["light"]
}

/**
 * Renderiza las acciones estándar de edición y eliminación para una fila del catálogo.
 */
export function RowActions({ onEdit, onDelete, C }: RowActionsProps) {
  return (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
        onPress={onEdit}
        activeOpacity={0.8}
      >
        <Text style={[styles.actionText, { color: C.primary }]}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: C.errorBackground }]}
        onPress={onDelete}
        activeOpacity={0.8}
      >
        <Text style={[styles.actionText, { color: C.error }]}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Fila de Facultad ──────────────────────────────────────────────────────────

interface FacultyRowProps {
  item: Faculty
  index: number
  programsCount: number
  onEdit: () => void
  onDelete: () => void
  C: typeof Colors["light"]
}

/**
 * Renderiza una fila de facultad con su contador de programas asociados.
 */
export function FacultyRow({ item, index, programsCount, onEdit, onDelete, C }: FacultyRowProps) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.indexBox, { backgroundColor: C.primary + "15" }]}>
        <Text style={[styles.indexText, { color: C.primary }]}>{index + 1}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: C.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.meta, { color: C.textSecondary }]}>
          {programsCount} programa{programsCount !== 1 ? "s" : ""}
        </Text>
      </View>
      <RowActions onEdit={onEdit} onDelete={onDelete} C={C} />
    </View>
  )
}

// ── Fila de Programa ──────────────────────────────────────────────────────────

interface ProgramRowProps {
  item: Program
  index: number
  subjectsCount: number
  onEdit: () => void
  onDelete: () => void
  C: typeof Colors["light"]
}

/**
 * Renderiza una fila de programa con facultad asociada y número de materias vinculadas.
 */
export function ProgramRow({ item, index, subjectsCount, onEdit, onDelete, C }: ProgramRowProps) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.indexBox, { backgroundColor: C.accent + "30" }]}>
        <Text style={[styles.indexText, { color: C.accentDark }]}>{index + 1}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: C.textPrimary }]}>{item.name}</Text>
        <View style={styles.tagsRow}>
          {item.faculty_name && (
            <View style={[styles.tag, { backgroundColor: C.primary + "12" }]}>
              <Text style={[styles.tagText, { color: C.primary }]}>{item.faculty_name}</Text>
            </View>
          )}
          <Text style={[styles.meta, { color: C.textSecondary }]}>
            {subjectsCount} materia{subjectsCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <RowActions onEdit={onEdit} onDelete={onDelete} C={C} />
    </View>
  )
}

// ── Fila de Materia ───────────────────────────────────────────────────────────

interface SubjectRowProps {
  item: Subject
  programs: Program[]
  onEdit: () => void
  onDelete: () => void
  C: typeof Colors["light"]
}

/**
 * Renderiza una fila de materia con los programas a los que está vinculada.
 */
export function SubjectRow({ item, programs, onEdit, onDelete, C }: SubjectRowProps) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.info, { flex: 1 }]}>
        <Text style={[styles.name, { color: C.textPrimary }]}>{item.name}</Text>
        <View style={styles.tagsRow}>
          {programs.length === 0 ? (
            <Text style={[styles.meta, { color: C.textPlaceholder }]}>Sin programas vinculados</Text>
          ) : (
            programs.map((p) => (
              <View key={p.id} style={[styles.tag, { backgroundColor: C.primary + "12" }]}>
                <Text style={[styles.tagText, { color: C.primary }]}>{p.name}</Text>
              </View>
            ))
          )}
        </View>
      </View>
      <RowActions onEdit={onEdit} onDelete={onDelete} C={C} />
    </View>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 10,
  },
  indexBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: { fontSize: 13, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 11, fontWeight: "600" },
  actions: { gap: 6 },
  actionBtn: {
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: { fontSize: 12, fontWeight: "600" },
})
