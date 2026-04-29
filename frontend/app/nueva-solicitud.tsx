/**
 * Modal para crear solicitudes de estudio.
 * Incluye validaciones básicas y selección de materia.
 */

import { Colors } from "@/constants/Colors";
import { useCreateStudyRequestForm } from "@/hooks/application/useCreateStudyRequestForm";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function NuevaSolicitudScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const {
    role,
    title,
    setTitle,
    description,
    setDescription,
    selectedSubject,
    setSelectedSubject,
    maxMembers,
    subjects,
    loadingData,
    isSubmitting,
    fetchError,
    loadData,
    isValid,
    handleCreate,
    decrementMembers,
    incrementMembers,
    subjectGroupCount,
    loadingCount,
  } = useCreateStudyRequestForm({
    onCreated: () => router.replace("/feed"),
  });

  const isLimitReached = subjectGroupCount >= 3;

  // Estados de carga / error / vacío
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
    );
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
    );
  }

  if (subjects.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>Sin materias inscritas</Text>
          <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
            {role === "admin"
              ? "No hay materias activas en el catálogo para crear la solicitud."
              : "Necesitas tener materias inscritas en tu perfil para crear una solicitud."}
          </Text>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.primary }]} onPress={() => router.back()}>
            <Text style={styles.actionBtnText}>Volver al feed</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Pantalla principal
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: C.textSecondary }]}> 
          Título de la solicitud *
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border }]}
          placeholder="Ej: Preparación parcial de Cálculo II"
          placeholderTextColor={C.textPlaceholder}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />
        <Text style={[styles.hint, { color: C.textSecondary }]}>
          {title.trim().length}/80 · mínimo 5 caracteres
        </Text>

        <Text style={[styles.label, { color: C.textSecondary }]}>
          Descripción *
        </Text>
        <TextInput
          style={[styles.input, styles.textarea, { backgroundColor: C.surface, color: C.textPrimary, borderColor: C.border }]}
          placeholder="¿Qué quieres estudiar? ¿Con qué frecuencia? ¿Qué nivel buscas?"
          placeholderTextColor={C.textPlaceholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={400}
        />
        <Text style={[styles.hint, { color: C.textSecondary }]}>
          {description.trim().length}/400 · mínimo 10 caracteres
        </Text>

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
            const active = selectedSubject === s.id;
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
                {active && (
                  <Text style={styles.chipCheck}>✓ </Text>
                )}
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
            );
          })}
        </ScrollView>

        {!selectedSubject && (
          <Text style={[styles.hint, { color: C.textSecondary, marginTop: 6 }]}>
            Desliza y selecciona la materia para tu grupo
          </Text>
        )}

        {selectedSubject && isLimitReached && (
          <View style={[styles.warningBanner, { backgroundColor: C.error + "10", borderColor: C.error + "30" }]}>
            <Text style={[styles.warningText, { color: C.error }]}>
              ⚠️ Ya existen {subjectGroupCount} grupos activos para esta asignatura. 
              Te recomendamos unirte a uno existente para fomentar la colaboración.
            </Text>
          </View>
        )}

        {selectedSubject && !isLimitReached && subjectGroupCount > 0 && (
          <Text style={[styles.hint, { color: C.primary, marginTop: 8, fontWeight: "600" }]}>
            Hay {subjectGroupCount} {subjectGroupCount === 1 ? "grupo activo" : "grupos activos"} para esta materia.
          </Text>
        )}

        <Text style={[styles.label, { color: C.textSecondary }]}>
          Cupos máximos (2–10)
        </Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.counterBtn, { borderColor: C.border, backgroundColor: C.surface }]}
            onPress={decrementMembers}
          >
            <Text style={[styles.counterBtnText, { color: C.textPrimary }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.counterValue, { color: C.textPrimary }]}>{maxMembers}</Text>
          <TouchableOpacity
            style={[styles.counterBtn, { borderColor: C.border, backgroundColor: C.surface }]}
            onPress={incrementMembers}
          >
            <Text style={[styles.counterBtnText, { color: C.textPrimary }]}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: (isValid && !isLimitReached) ? C.primary : C.border, opacity: (isSubmitting || loadingCount) ? 0.7 : 1 },
          ]}
          onPress={handleCreate}
          disabled={!isValid || isSubmitting || loadingCount || isLimitReached}
        >
          {isSubmitting || loadingCount ? (
            <ActivityIndicator color={C.textOnPrimary} />
          ) : (
            <Text style={[styles.submitText, { color: (isValid && !isLimitReached) ? C.textOnPrimary : C.textSecondary }]}>
              {isLimitReached 
                ? "Límite de grupos alcanzado" 
                : (isValid ? "Publicar solicitud" : "Completa los campos requeridos")}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingTop: Platform.OS === "android" ? 16 : 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },

  label: { fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 20, textTransform: "uppercase", letterSpacing: 0.6 },
  hint: { fontSize: 11, marginTop: 4 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 100 },

  // Carrusel
  carousel: { marginBottom: 4 },
  carouselContent: { gap: 10, paddingRight: 8, paddingVertical: 4 },
  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    maxWidth: 160,
    minWidth: 100,
  },
  chipCheck: { color: "#fff", fontWeight: "700", fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: "500", flexShrink: 1 },

  // Contador
  counterRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  counterBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  counterBtnText: { fontSize: 20, lineHeight: 22 },
  counterValue: { fontSize: 22, fontWeight: "700", minWidth: 30, textAlign: "center" },

  // Submit
  submitBtn: { marginTop: 32, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  submitText: { fontSize: 16, fontWeight: "700" },

  // Vacíos / error
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { fontSize: 15, textAlign: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginTop: 4 },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  warningBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  warningText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    flex: 1,
  },
});