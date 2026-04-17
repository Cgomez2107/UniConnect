/**
 * app/subir-recurso.tsx
 * Modal para subir un recurso de estudio — US-006
 *
 * Flujo:
 *  1. Seleccionar materia (chips horizontales)
 *  2. Escribir título y descripción
 *  3. Seleccionar archivo (expo-document-picker)
 *  4. Validar formato y tamaño
 *  5. Subir y confirmar
 */

import { Colors } from "@/constants/Colors"
import { useUploadResourceForm } from "@/hooks/application/useUploadResourceForm"
import { router } from "expo-router"
import { useColorScheme } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

export default function SubirRecursoScreen() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const {
    role,
    title,
    setTitle,
    description,
    setDescription,
    selectedSubject,
    setSelectedSubject,
    pickedFile,
    setPickedFile,
    subjects,
    loadingData,
    fetchError,
    loadData,
    uploading,
    uploadError,
    handlePickFile,
    isValid,
    handleUpload,
    formatSize,
  } = useUploadResourceForm()

  // ── Estados de carga / error / vacío ─────────────────────────────────────
  if (loadingData) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>
            Cargando materias disponibles…
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (fetchError) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: C.error }]}>{fetchError}</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.primary }]}
            onPress={loadData}
          >
            <Text style={styles.actionBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (subjects.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
            Sin materias inscritas
          </Text>
          <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
            {role === "admin"
              ? "No hay materias activas en el catálogo para subir un recurso."
              : "Necesitas tener materias inscritas para subir un recurso."}
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.actionBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Pantalla principal ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backBtn, { color: C.primary }]}>← Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: C.textPrimary }]}>
            Subir recurso
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* ── Título ──────────────────────────────────────────────── */}
        <Text style={[styles.label, { color: C.textSecondary }]}>Título *</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border },
          ]}
          placeholder="Ej: Resumen Capítulo 3 - Cálculo II"
          placeholderTextColor={C.textPlaceholder}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Text style={[styles.hint, { color: C.textSecondary }]}>
          {title.trim().length}/100 · mínimo 3 caracteres
        </Text>

        {/* ── Descripción ─────────────────────────────────────────── */}
        <Text style={[styles.label, { color: C.textSecondary }]}>
          Descripción (opcional)
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textarea,
            { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border },
          ]}
          placeholder="Describe brevemente el contenido del recurso…"
          placeholderTextColor={C.textPlaceholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={300}
        />
        <Text style={[styles.hint, { color: C.textSecondary }]}>
          {description.trim().length}/300
        </Text>

        {/* ── Materia ─────────────────────────────────────────────── */}
        <Text style={[styles.label, { color: C.textSecondary }]}>
          Materia *{" "}
          <Text style={{ fontSize: 11, textTransform: "none" }}>
            ({subjects.length} disponibles)
          </Text>
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          style={styles.carousel}
        >
          {subjects.map((s) => {
            const active = selectedSubject === s.id
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.subjectChip,
                  {
                    backgroundColor: active ? C.primary : C.surface,
                    borderColor: active ? C.primary : C.border,
                  },
                ]}
                onPress={() => setSelectedSubject(active ? null : s.id)}
                activeOpacity={0.75}
              >
                {active && <Text style={styles.chipCheck}>✓ </Text>}
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? C.textOnPrimary : C.textPrimary },
                  ]}
                  numberOfLines={2}
                >
                  {s.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* ── Archivo ─────────────────────────────────────────────── */}
        <Text style={[styles.label, { color: C.textSecondary }]}>Archivo *</Text>

        {pickedFile ? (
          <View
            style={[
              styles.fileCard,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
          >
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: C.textPrimary }]} numberOfLines={1}>
                📎 {pickedFile.name}
              </Text>
              <Text style={[styles.fileSize, { color: C.textSecondary }]}>
                {formatSize(pickedFile.size)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setPickedFile(null)}>
              <Text style={[styles.removeFile, { color: C.error }]}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.pickBtn,
              { backgroundColor: C.surface, borderColor: C.border },
            ]}
            onPress={handlePickFile}
            activeOpacity={0.85}
          >
            <Text style={styles.pickIcon}>📁</Text>
            <Text style={[styles.pickText, { color: C.primary }]}>
              Seleccionar archivo
            </Text>
            <Text style={[styles.pickHint, { color: C.textSecondary }]}>
              PDF, DOCX, XLSX, PPTX, TXT, JPG, PNG · máx 10 MB
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Error de subida ─────────────────────────────────────── */}
        {uploadError ? (
          <Text style={[styles.uploadError, { color: C.error }]}>
            ⚠️ {uploadError}
          </Text>
        ) : null}

        {/* ── Botón de subir ──────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: isValid && !uploading ? C.primary : C.border,
            },
          ]}
          onPress={handleUpload}
          disabled={!isValid || uploading}
          activeOpacity={0.85}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={C.textOnPrimary} />
          ) : (
            <Text
              style={[
                styles.submitText,
                { color: isValid ? C.textOnPrimary : C.textSecondary },
              ]}
            >
              📤 Subir recurso
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40, gap: 4 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  loadingText: { fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 14, textAlign: "center" },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  actionBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: { fontSize: 15, fontWeight: "600" },
  screenTitle: { fontSize: 18, fontWeight: "700" },

  // Form
  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 80, maxHeight: 120 },
  hint: { fontSize: 11, marginTop: 2 },

  // Subject carousel
  carousel: { marginBottom: 4 },
  carouselContent: { gap: 8, paddingVertical: 4 },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 180,
  },
  chipCheck: { color: "#fff", fontWeight: "700", fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: "500" },

  // File picker
  pickBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  pickIcon: { fontSize: 28 },
  pickText: { fontSize: 15, fontWeight: "600" },
  pickHint: { fontSize: 11, textAlign: "center" },

  // Selected file card
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  fileInfo: { flex: 1, gap: 2 },
  fileName: { fontSize: 14, fontWeight: "500" },
  fileSize: { fontSize: 12 },
  removeFile: { fontSize: 18, fontWeight: "700", padding: 4 },

  // Upload
  uploadError: { fontSize: 13, marginTop: 4 },
  submitBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { fontSize: 16, fontWeight: "700" },
})
