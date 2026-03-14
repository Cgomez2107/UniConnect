// Filas de lista para el panel de administración.

import { Colors } from "@/constants/Colors"
import type { AdminEvent, AdminRequest, AdminResource, AdminUser, EventCategory, Faculty, Program, Subject } from "@/types"
import * as Haptics from "expo-haptics"
import { useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native"

// Helper: tiempo relativo

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora mismo"
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

// Hook: animación de entrada

function useEntryAnim() {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(12)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start()
  }, [fadeAnim, slideAnim])
  return { fadeAnim, slideAnim }
}

// Acciones

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
        activeOpacity={0.85}
      >
        <Text style={[styles.actionText, { color: C.primary }]}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: C.errorBackground }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onDelete()
        }}
        activeOpacity={0.85}
      >
        <Text style={[styles.actionText, { color: C.error }]}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  )
}

// Fila de Facultad

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
  const { fadeAnim, slideAnim } = useEntryAnim()
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
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
    </Animated.View>
  )
}

// Fila de Programa

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
  const { fadeAnim, slideAnim } = useEntryAnim()
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={[styles.indexBox, { backgroundColor: (C as any).accent + "30" }]}>
          <Text style={[styles.indexText, { color: (C as any).accentDark }]}>{index + 1}</Text>
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
    </Animated.View>
  )
}

// Fila de Materia

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
  const { fadeAnim, slideAnim } = useEntryAnim()
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
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
    </Animated.View>
  )
}

// Estilos compartidos
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
  // avatar iniciales — igual que CardSolicitud (40×40)
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "700" },
  // badge pill — igual que CardSolicitud
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 10 },
  headerInfo: { flex: 1 },
  // icono de archivo en caja — consistente con indexBox
  fileBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
})

// Fila de Usuario

const ROLE_COLORS: Record<string, string> = { admin: "#7c3aed", estudiante: "#2563eb" }
const ROLE_BG: Record<string, string>     = { admin: "#7c3aed20", estudiante: "#2563eb20" }
const ROLE_LABEL: Record<string, string>  = { admin: "🛡️ Admin", estudiante: "🎓 Estudiante" }

interface UserRowProps {
  item: AdminUser
  onToggleRole: () => void
  onToggleActive: () => void
  C: typeof Colors["light"]
}

export function UserRow({ item, onToggleRole, onToggleActive, C }: UserRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim()
  const initials = item.full_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border, alignItems: "flex-start" }]}>
        <View style={[styles.avatar, { backgroundColor: C.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: C.primary }]}>{initials}</Text>
        </View>
        <View style={[styles.info]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.name, { color: C.textPrimary, flex: 1 }]} numberOfLines={1}>
              {item.full_name}
            </Text>
            <Text style={[styles.meta, { color: C.textSecondary, marginTop: 0 }]}>
              {getTimeAgo(item.created_at)}
            </Text>
          </View>
          <Text style={[styles.meta, { color: C.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={[styles.tagsRow, { marginTop: 6 }]}>
            <View style={[styles.badge, {
              backgroundColor: item.is_active ? "#22c55e20" : "#ef444420",
            }]}>
              <Text style={[styles.badgeText, { color: item.is_active ? "#22c55e" : "#ef4444" }]}>
                {item.is_active ? "Activo" : "Inactivo"}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: ROLE_BG[item.role] ?? C.border }]}>
              <Text style={[styles.badgeText, { color: ROLE_COLORS[item.role] ?? C.textSecondary }]}>
                {ROLE_LABEL[item.role] ?? item.role}
              </Text>
            </View>
          </View>
          <View style={[styles.tagsRow, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onToggleRole()
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, { color: C.primary }]}>
                {item.role === "admin" ? "Hacer Estudiante" : "Hacer Admin"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, {
                backgroundColor: item.is_active ? C.errorBackground : "#22c55e15",
              }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onToggleActive()
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, {
                color: item.is_active ? C.error : "#22c55e",
              }]}>
                {item.is_active ? "Suspender" : "Activar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

// Fila de Solicitud

const STATUS_COLOR: Record<string, string> = {
  abierta: "#22c55e",
  cerrada: "#ef4444",
  expirada: "#f59e0b",
}

interface RequestRowProps {
  item: AdminRequest
  onClose: () => void
  onDelete: () => void
  C: typeof Colors["light"]
}

export function RequestRow({ item, onClose, onDelete, C }: RequestRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim()

  // Iniciales del autor
  const initials = (item.author_name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border, alignItems: "flex-start" }]}>
        <View style={[styles.avatar, { backgroundColor: C.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: C.primary }]}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.name, { color: C.textPrimary, flex: 1 }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: C.textSecondary, marginTop: 0 }]}>
              {getTimeAgo(item.created_at)}
            </Text>
          </View>
          <Text style={[styles.meta, { color: C.textSecondary }]}>
            {item.author_name} · 📚 {item.subject_name}
          </Text>
          <View style={[styles.tagsRow, { marginTop: 6 }]}>
            <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#94a3b8") + "20" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? C.textSecondary }]}>
                {item.status}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: C.primary + "12" }]}>
              <Text style={[styles.badgeText, { color: C.primary }]}>
                👥 {item.applications_count} postulaciones
              </Text>
            </View>
          </View>
          <View style={[styles.tagsRow, { marginTop: 8 }]}>
            {item.status === "abierta" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  onClose()
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionText, { color: C.primary }]}>Cerrar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.errorBackground }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onDelete()
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, { color: C.error }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

// Fila de Recurso

const FILE_ICON: Record<string, string> = {
  PDF: "📄", DOCX: "📝", DOC: "📝", XLSX: "📊", XLS: "📊",
  PPTX: "📋", PPT: "📋", TXT: "📃", JPG: "🖼️", PNG: "🖼️",
}
const FILE_COLOR: Record<string, string> = {
  PDF: "#ef4444", DOCX: "#2563eb", DOC: "#2563eb", XLSX: "#22c55e", XLS: "#22c55e",
  PPTX: "#f59e0b", PPT: "#f59e0b", TXT: "#64748b", JPG: "#a855f7", PNG: "#a855f7",
}

interface ResourceRowProps {
  item: AdminResource
  onDelete: () => void
  C: typeof Colors["light"]
}

export function ResourceRow({ item, onDelete, C }: ResourceRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim()
  const typeKey = item.file_type?.toUpperCase() ?? ""
  const icon    = FILE_ICON[typeKey] ?? "📁"
  const color   = FILE_COLOR[typeKey] ?? C.textSecondary
  const sizeLabel = item.file_size_kb
    ? item.file_size_kb >= 1024
      ? `${(item.file_size_kb / 1024).toFixed(1)} MB`
      : `${item.file_size_kb} KB`
    : ""

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border, alignItems: "flex-start" }]}>
        <View style={[styles.fileBox, { backgroundColor: color + "18" }]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <View style={styles.info}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.name, { color: C.textPrimary, flex: 1 }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: C.textSecondary, marginTop: 0 }]}>
              {getTimeAgo(item.created_at)}
            </Text>
          </View>
          <Text style={[styles.meta, { color: C.textSecondary }]}>
            {item.author_name} · 📚 {item.subject_name}
          </Text>

          {/* Badges: tipo + tamaño */}
          <View style={[styles.tagsRow, { marginTop: 6 }]}>
            {typeKey ? (
              <View style={[styles.badge, { backgroundColor: color + "18" }]}>
                <Text style={[styles.badgeText, { color }]}>{typeKey}</Text>
              </View>
            ) : null}
            {sizeLabel ? (
              <View style={[styles.badge, { backgroundColor: C.border }]}>
                <Text style={[styles.badgeText, { color: C.textSecondary }]}>{sizeLabel}</Text>
              </View>
            ) : null}
          </View>

          {/* Acción */}
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.errorBackground, alignSelf: "flex-start" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onDelete()
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, { color: C.error }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

// Fila de Evento

const CATEGORY_ICON: Record<EventCategory, string>  = { academico: "🎓", cultural: "🎭", deportivo: "⚽", otro: "📌" }
const CATEGORY_COLOR: Record<EventCategory, string> = { academico: "#2563eb", cultural: "#a855f7", deportivo: "#22c55e", otro: "#f59e0b" }
const CATEGORY_LABEL: Record<EventCategory, string> = { academico: "Académico", cultural: "Cultural", deportivo: "Deportivo", otro: "Otro" }

function formatEventDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

interface EventRowProps {
  item: AdminEvent
  onEdit: () => void
  onDelete: () => void
  C: typeof Colors["light"]
}

export function EventRow({ item, onEdit, onDelete, C }: EventRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim()
  const catColor = CATEGORY_COLOR[item.category] ?? C.textSecondary

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border, alignItems: "flex-start" }]}>

        {/* Icono de categoría */}
        <View style={[styles.fileBox, { backgroundColor: catColor + "18" }]}>
          <Text style={{ fontSize: 22 }}>{CATEGORY_ICON[item.category] ?? "📅"}</Text>
        </View>
        <View style={styles.info}>
          {/* Título + timestamp de creación */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.name, { color: C.textPrimary, flex: 1 }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: C.textSecondary, marginTop: 0 }]}>
              {getTimeAgo(item.created_at)}
            </Text>
          </View>

          {/* Fecha del evento */}
          <Text style={[styles.meta, { color: C.textSecondary }]}>
            📅 {formatEventDate(item.event_date)}
          </Text>

          {/* Lugar (si hay) */}
          {item.location ? (
            <Text style={[styles.meta, { color: C.textSecondary }]} numberOfLines={1}>
              📍 {item.location}
            </Text>
          ) : null}

          {/* Badges: categoría + creador */}
          <View style={[styles.tagsRow, { marginTop: 6 }]}>
            <View style={[styles.badge, { backgroundColor: catColor + "18" }]}>
              <Text style={[styles.badgeText, { color: catColor }]}>
                {CATEGORY_LABEL[item.category] ?? item.category}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: C.border }]}>
              <Text style={[styles.badgeText, { color: C.textSecondary }]}>por {item.creator_name}</Text>
            </View>
          </View>
          <View style={[styles.tagsRow, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onEdit()
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, { color: C.primary }]}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.errorBackground }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onDelete()
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, { color: C.error }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  )
}
