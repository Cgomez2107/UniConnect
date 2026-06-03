/**
 * app/subir-recurso.tsx
 * Modal para subir un recurso de estudio — US-V03
 *
 * Flujo Archivo:
 *  1. Seleccionar materia (chips horizontales)
 *  2. Escribir título y descripción
 *  3. Seleccionar archivo (expo-document-picker)
 *  4. Validar formato y tamaño
 *  5. Subir y confirmar
 *
 * Flujo Enlace:
 *  1. Seleccionar materia
 *  2. Ingresar URL externa + obtener previsualización OG
 *  3. Escribir título y descripción
 *  4. Subir y confirmar
 */

import { Colors } from "@/constants/Colors"
import { useUploadResourceForm } from "@/hooks/application/useUploadResourceForm"
import { DIContainer } from "@/lib/services/di/container"
import { useAuthStore } from "@/store/useAuthStore"
import { router } from "expo-router"
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
  useColorScheme,
} from "react-native"
import { useState } from "react"

type UploadMode = "file" | "link"

export default function SubirRecursoScreen() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const user = useAuthStore((s) => s.user)
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

  const [uploadMode, setUploadMode] = useState<UploadMode>("file")
  const [externalUrl, setExternalUrl] = useState("")

  const handleUploadLink = async () => {
    if (!user?.id || !title.trim() || !selectedSubject || !externalUrl.trim()) {
      Alert.alert("Error", "Completa todos los campos requeridos.")
      return
    }

    const profileUseCase = DIContainer.getInstance().getGetMyPrograms()
    const programs = await profileUseCase.execute(user.id)
    const programId = programs?.[0]?.program_id
    if (!programId) {
      Alert.alert("Error", "No se encontró un programa asociado.")
      return
    }

    try {
      const container = DIContainer.getInstance()
      const useCase = container.getUploadStudyResource()
      await useCase.execute({
        userId: user.id,
        programId,
        subject_id: selectedSubject,
        title: title.trim(),
        description: description.trim() || undefined,
        file_url: externalUrl.trim(),
        file_name: externalUrl.trim(),
        file_type: "link",
      })
      Alert.alert("¡Recurso subido! 📚", "Tu enlace ya está disponible.", [
        { text: "Aceptar", onPress: () => router.back() },
      ])
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo subir el recurso.")
    }
  }

  const isLinkValid = title.trim().length >= 3 && !!selectedSubject && externalUrl.trim().length > 0

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
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.primary }]} onPress={loadData}>
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
          <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>Sin materias inscritas</Text>
          <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
            {role === "admin"
              ? "No hay materias activas en el catálogo."
              : "Necesitas tener materias inscritas para subir un recurso."}
          </Text>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.primary }]} onPress={() => router.back()}>
            <Text style={styles.actionBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Pantalla principal ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backBtn, { color: C.primary }]}>← Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: C.textPrimary }]}>Subir recurso</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* ── Mode toggle ─────────────────────────────────────────── */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeChip, { backgroundColor: uploadMode === "file" ? C.primary : C.surface, borderColor: uploadMode === "file" ? C.primary : C.border }]}
            onPress={() => setUploadMode("file")}
          >
            <Text style={[styles.modeChipText, { color: uploadMode === "file" ? C.textOnPrimary : C.textSecondary }]}>
              📁 Archivo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeChip, { backgroundColor: uploadMode === "link" ? C.primary : C.surface, borderColor: uploadMode === "link" ? C.primary : C.border }]}
            onPress={() => setUploadMode("link")}
          >
            <Text style={[styles.modeChipText, { color: uploadMode === "link" ? C.textOnPrimary : C.textSecondary }]}>
              🔗 Enlace
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Título ──────────────────────────────────────────────── */}
        <Text style={[styles.label, { color: C.textSecondary }]}>Título *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border }]}
          placeholder="Ej: Resumen Capítulo 3 - Cálculo II"
          placeholderTextColor={C.textPlaceholder}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Text style={[styles.hint, { color: C.textSecondary }]}>{title.trim().length}/100 · mínimo 3 caracteres</Text>

        {/* ── Descripción ─────────────────────────────────────────── */}
        <Text style={[styles.label, { color: C.textSecondary }]}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textarea, { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border }]}
          placeholder={uploadMode === "link" ? "Describe el contenido del enlace…" : "Describe brevemente el contenido…"}
          placeholderTextColor={C.textPlaceholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={300}
        />
        <Text style={[styles.hint, { color: C.textSecondary }]}>{description.trim().length}/300</Text>

        {/* ── Materia ─────────────────────────────────────────────── */}
        <Text style={[styles.label, { color: C.textSecondary }]}>
          Materia * <Text style={{ fontSize: 11, textTransform: "none" }}>({subjects.length} disponibles)</Text>
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent} style={styles.carousel}>
          {subjects.map((s) => {
            const active = selectedSubject === s.id
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.subjectChip, { backgroundColor: active ? C.primary : C.surface, borderColor: active ? C.primary : C.border }]}
                onPress={() => setSelectedSubject(active ? null : s.id)}
                activeOpacity={0.75}
              >
                {active && <Text style={styles.chipCheck}>✓ </Text>}
                <Text style={[styles.chipText, { color: active ? C.textOnPrimary : C.textPrimary }]} numberOfLines={2}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* ── File / Link ─────────────────────────────────────────── */}
        {uploadMode === "file" ? (
          <>
            <Text style={[styles.label, { color: C.textSecondary }]}>Archivo *</Text>
            {pickedFile ? (
              <View style={[styles.fileCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: C.textPrimary }]} numberOfLines={1}>
                    📎 {pickedFile.name}
                  </Text>
                  <Text style={[styles.fileSize, { color: C.textSecondary }]}>{formatSize(pickedFile.size)}</Text>
                </View>
                <TouchableOpacity onPress={() => setPickedFile(null)}>
                  <Text style={[styles.removeFile, { color: C.error }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.pickBtn, { backgroundColor: C.surface, borderColor: C.border }]}
                onPress={handlePickFile}
                activeOpacity={0.85}
              >
                <Text style={styles.pickIcon}>📁</Text>
                <Text style={[styles.pickText, { color: C.primary }]}>Seleccionar archivo</Text>
                <Text style={[styles.pickHint, { color: C.textSecondary }]}>PDF, DOC, etc. · máx 10 MB</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: C.textSecondary }]}>URL del recurso *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border }]}
              placeholder="https://ejemplo.com/recurso"
              placeholderTextColor={C.textPlaceholder}
              value={externalUrl}
              onChangeText={setExternalUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </>
        )}

        {/* ── Error de subida ─────────────────────────────────────── */}
        {uploadError ? <Text style={[styles.uploadError, { color: C.error }]}>⚠️ {uploadError}</Text> : null}

        {/* ── Botón de subir ──────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: uploadMode === "file" ? (isValid && !uploading ? C.primary : C.border) : (isLinkValid ? C.primary : C.border) }]}
          onPress={uploadMode === "file" ? handleUpload : handleUploadLink}
          disabled={uploadMode === "file" ? (!isValid || uploading) : !isLinkValid}
          activeOpacity={0.85}
        >
          <Text style={[styles.submitText, { color: C.textOnPrimary }]}>
            {uploading ? "Subiendo…" : "📤 Subir recurso"}
          </Text>
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

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  backBtn: { fontSize: 15, fontWeight: "600" },
  screenTitle: { fontSize: 18, fontWeight: "700" },

  modeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  modeChipText: { fontSize: 14, fontWeight: "600" },

  label: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 80, maxHeight: 120 },
  hint: { fontSize: 11, marginTop: 2 },

  carousel: { marginBottom: 4 },
  carouselContent: { gap: 8, paddingVertical: 4 },
  subjectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flexDirection: "row", alignItems: "center", maxWidth: 180 },
  chipCheck: { color: "#fff", fontWeight: "700", fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: "500" },

  pickBtn: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 12, padding: 24, alignItems: "center", gap: 6 },
  pickIcon: { fontSize: 28 },
  pickText: { fontSize: 15, fontWeight: "600" },
  pickHint: { fontSize: 11, textAlign: "center" },

  fileCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  fileInfo: { flex: 1, gap: 2 },
  fileName: { fontSize: 14, fontWeight: "500" },
  fileSize: { fontSize: 12 },
  removeFile: { fontSize: 18, fontWeight: "700", padding: 4 },



  uploadError: { fontSize: 13, marginTop: 4 },
  submitBtn: { marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  submitText: { fontSize: 16, fontWeight: "700" },
})
