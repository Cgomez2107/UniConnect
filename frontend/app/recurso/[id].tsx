/**
 * app/recurso/[id].tsx
 * Detalle de un recurso de estudio — US-006
 *
 * Muestra información completa del recurso:
 *  - Icono de tipo + título
 *  - Autor, materia, fecha
 *  - Descripción completa
 *  - Tamaño, tipo de archivo
 *  - Botón "Abrir archivo"
 *  - Edición de título/descripción (si es propietario)
 *  - Eliminación con doble confirmación (si es propietario)
 */

import { Colors } from "@/constants/Colors"
import { useResourceDetail } from "@/hooks/application/useResourceDetail"
import { router, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// ── Helpers ───────────────────────────────────────────────────────────────────

const FILE_ICONS: Record<string, string> = {
  PDF: "📄",
  DOCX: "📝",
  DOC: "📝",
  XLSX: "📊",
  XLS: "📊",
  PPTX: "📽️",
  PPT: "📽️",
  TXT: "📃",
  JPG: "🖼️",
  JPEG: "🖼️",
  PNG: "🖼️",
}

function formatSize(kb: number | null): string {
  if (!kb) return "—"
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RecursoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const insets = useSafeAreaInsets()
  const {
    resource,
    loading,
    error,
    editing,
    setEditing,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    saving,
    deleting,
    downloading,
    isOwn,
    handleDownload,
    handleSave,
    handleDelete,
    cancelEditing,
  } = useResourceDetail({
    resourceId: id,
    onDeleted: () => router.back(),
  })

  // ── Abrir archivo ───────────────────────────────────────────────────────
  const handleOpen = () => {
    if (resource?.file_url) {
      router.push({
        pathname: "/viewer",
        params: {
          url: resource.file_url,
          title: resource.title,
          fileName: resource.file_name,
          fileType: resource.file_type ?? "",
        },
      })
    }
  }

  // ── Estados de carga / error ────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>
            Cargando recurso…
          </Text>
        </View>
      </View>
    )
  }

  if (error || !resource) {
    return (
      <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>⚠️</Text>
          <Text style={[styles.errorText, { color: C.error }]}>
            {error ?? "Recurso no encontrado"}
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.actionBtnText, { color: C.textOnPrimary }]}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Datos derivados ─────────────────────────────────────────────────────
  const fileType = resource.file_type?.toUpperCase() ?? "?"
  const icon = FILE_ICONS[fileType] ?? "📎"
  const authorName = resource.profiles?.full_name ?? "Estudiante"
  const subjectName = resource.subjects?.name ?? ""
  const initials = getInitials(authorName)

  // ── Pantalla principal ────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header: volver ──────────────────────────────────────── */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: C.primary }]}>← Volver</Text>
        </TouchableOpacity>

        {/* ── Icono + tipo badge ───────────────────────────────────── */}
        <View style={styles.heroRow}>
          <View style={[styles.heroIcon, { backgroundColor: C.primary + "15" }]}>
            <Text style={styles.heroIconText}>{icon}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: C.primary + "18" }]}>
            <Text style={[styles.typeBadgeText, { color: C.primary }]}>{fileType}</Text>
          </View>
          <Text style={[styles.sizeText, { color: C.textSecondary }]}>
            {formatSize(resource.file_size_kb)}
          </Text>
        </View>

        {/* ── Título (editable o estático) ─────────────────────────── */}
        {editing ? (
          <>
            <Text style={[styles.label, { color: C.textSecondary }]}>Título *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border }]}
              value={editTitle}
              onChangeText={setEditTitle}
              maxLength={100}
            />
          </>
        ) : (
          <Text style={[styles.title, { color: C.textPrimary }]}>{resource.title}</Text>
        )}

        {/* ── Materia ─────────────────────────────────────────────── */}
        {subjectName ? (
          <View style={[styles.subjectTag, { backgroundColor: C.primary + "12" }]}>
            <Text style={[styles.subjectText, { color: C.primary }]}>📚 {subjectName}</Text>
          </View>
        ) : null}

        {/* ── Autor ───────────────────────────────────────────────── */}
        <View style={[styles.authorCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: C.primary + "20" }]}>
            <Text style={[styles.avatarText, { color: C.primary }]}>{initials}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: C.textPrimary }]}>{authorName}</Text>
            <Text style={[styles.authorDate, { color: C.textSecondary }]}>
              {formatDate(resource.created_at)}
            </Text>
          </View>
          {isOwn && (
            <View style={[styles.ownBadge, { borderColor: C.accent }]}>
              <Text style={[styles.ownBadgeText, { color: C.accent }]}>Tuyo</Text>
            </View>
          )}
        </View>

        {/* ── Descripción (editable o estática) ───────────────────── */}
        <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Descripción</Text>

        {editing ? (
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border }]}
            value={editDescription}
            onChangeText={setEditDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
            placeholder="Describe el contenido del recurso…"
            placeholderTextColor={C.textPlaceholder}
          />
        ) : resource.description ? (
          <Text style={[styles.description, { color: C.textPrimary }]}>
            {resource.description}
          </Text>
        ) : (
          <Text style={[styles.noDescription, { color: C.textSecondary }]}>
            Sin descripción.
          </Text>
        )}

        {/* ── Detalles del archivo ────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Detalles del archivo</Text>
        <View style={[styles.detailsCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: C.textSecondary }]}>Nombre</Text>
            <Text style={[styles.detailValue, { color: C.textPrimary }]} numberOfLines={1}>
              {resource.file_name}
            </Text>
          </View>
          <View style={[styles.detailSeparator, { backgroundColor: C.border }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: C.textSecondary }]}>Formato</Text>
            <Text style={[styles.detailValue, { color: C.textPrimary }]}>{fileType}</Text>
          </View>
          <View style={[styles.detailSeparator, { backgroundColor: C.border }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: C.textSecondary }]}>Tamaño</Text>
            <Text style={[styles.detailValue, { color: C.textPrimary }]}>
              {formatSize(resource.file_size_kb)}
            </Text>
          </View>
        </View>

        {/* ── Botones de acción ───────────────────────────────────── */}
        <View style={styles.actionsSection}>
          {/* Abrir y Descargar */}
          {!editing && (
            <View style={styles.fileActions}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: C.primary, flex: 1 }]}
                onPress={handleOpen}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryBtnText, { color: C.textOnPrimary }]}>
                  📂 Abrir
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: C.primary }]}
                onPress={handleDownload}
                disabled={downloading}
                activeOpacity={0.85}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <Text style={[styles.secondaryBtnText, { color: C.primary }]}>⬇️ Descargar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Acciones del propietario */}
          {isOwn && !editing && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: C.primary }]}
                onPress={() => setEditing(true)}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryBtnText, { color: C.primary }]}>✏️ Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: C.error }]}
                onPress={handleDelete}
                disabled={deleting}
                activeOpacity={0.85}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={C.error} />
                ) : (
                  <Text style={[styles.secondaryBtnText, { color: C.error }]}>🗑️ Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Botones de modo edición */}
          {editing && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: C.border }]}
                onPress={cancelEditing}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryBtnText, { color: C.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: C.primary, flex: 1 }]}
                onPress={handleSave}
                disabled={saving || editTitle.trim().length < 3}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={C.textOnPrimary} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: C.textOnPrimary }]}>
                    💾 Guardar cambios
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 20, gap: 4 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 14, textAlign: "center" },
  actionBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  actionBtnText: { fontSize: 14, fontWeight: "600" },

  // Back
  backRow: { marginBottom: 12 },
  backText: { fontSize: 15, fontWeight: "600" },

  // Hero
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  heroIcon: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  heroIconText: { fontSize: 30 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 13, fontWeight: "700" },
  sizeText: { fontSize: 13 },

  // Title
  title: { fontSize: 22, fontWeight: "700", lineHeight: 28, marginBottom: 10 },

  // Subject
  subjectTag: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginBottom: 12 },
  subjectText: { fontSize: 13, fontWeight: "600" },

  // Author
  authorCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, gap: 10, marginBottom: 16 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "700" },
  authorInfo: { flex: 1, gap: 2 },
  authorName: { fontSize: 14, fontWeight: "600" },
  authorDate: { fontSize: 12 },
  ownBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ownBadgeText: { fontSize: 11, fontWeight: "600" },

  // Sections
  sectionLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8, marginBottom: 6 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  noDescription: { fontSize: 14, fontStyle: "italic", marginBottom: 12 },

  // Details card
  detailsCard: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 16, gap: 0 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: "500", maxWidth: "60%" },
  detailSeparator: { height: 1 },

  // Form (edit mode)
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 8 },
  textarea: { minHeight: 100, maxHeight: 160 },

  // Actions
  actionsSection: { marginTop: 8, gap: 12 },
  fileActions: { flexDirection: "row", gap: 10 },
  primaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  primaryBtnText: { fontSize: 16, fontWeight: "700" },
  ownerActions: { flexDirection: "row", gap: 10 },
  secondaryBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontSize: 14, fontWeight: "600" },
})
