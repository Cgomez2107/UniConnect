/**
 * Modal para crear solicitudes de estudio.
 * Incluye validaciones básicas y selección de materia.
 */

import { Colors } from "@/constants/Colors";
import {
  createStudyRequest,
  getAvailableSubjectsForCurrentUser,
  type Subject,
} from "@/lib/services/studyRequestsService";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
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
  const role = useAuthStore((s) => s.user?.role);

  // Formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [maxMembers, setMaxMembers] = useState("4");

  // Estado remoto
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Carga inicial
  const loadData = async () => {
    setLoadingData(true);
    setFetchError(null);
    try {
      const subs = await getAvailableSubjectsForCurrentUser();
      setSubjects(subs);
    } catch (e: any) {
      setFetchError(e?.message ?? "No se pudieron cargar las materias disponibles.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Validación
  const isValid =
    title.trim().length >= 5 &&
    description.trim().length >= 10 &&
    !!selectedSubject;

  // Envío
  const handleCreate = async () => {
    if (!isValid || !selectedSubject) return;
    setIsSubmitting(true);
    try {
      await createStudyRequest({
        title: title.trim(),
        description: description.trim(),
        subject_id: selectedSubject,
        max_members: Math.max(2, Math.min(10, parseInt(maxMembers) || 4)),
      });
      Alert.alert(
        "¡Solicitud creada! 🎉",
        "Tu grupo de estudio ya está visible en el feed.",
        [{ text: "Ver feed", onPress: () => router.back() }]
      );
    } catch (e: any) {
      // Mensaje amigable para el constraint de solicitud duplicada
      const msg = e?.message ?? "";
      const friendlyMsg = msg.includes("unique_open_request_per_subject")
        ? "Ya tienes una solicitud abierta para esta materia. Ciérrala antes de crear una nueva."
        : msg || "Intenta de nuevo.";
      Alert.alert("Error al crear", friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <Text style={[styles.label, { color: C.textSecondary }]}>
          Cupos máximos (2–10)
        </Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.counterBtn, { borderColor: C.border, backgroundColor: C.surface }]}
            onPress={() => setMaxMembers((prev) => String(Math.max(2, parseInt(prev) - 1)))}
          >
            <Text style={[styles.counterBtnText, { color: C.textPrimary }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.counterValue, { color: C.textPrimary }]}>{maxMembers}</Text>
          <TouchableOpacity
            style={[styles.counterBtn, { borderColor: C.border, backgroundColor: C.surface }]}
            onPress={() => setMaxMembers((prev) => String(Math.min(10, parseInt(prev) + 1)))}
          >
            <Text style={[styles.counterBtnText, { color: C.textPrimary }]}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: isValid ? C.primary : C.border, opacity: isSubmitting ? 0.7 : 1 },
          ]}
          onPress={handleCreate}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={C.textOnPrimary} />
          ) : (
            <Text style={[styles.submitText, { color: isValid ? C.textOnPrimary : C.textSecondary }]}>
              {isValid ? "Publicar solicitud" : "Completa los campos requeridos"}
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
});