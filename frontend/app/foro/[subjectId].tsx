import { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";
import { useForum } from "@/hooks/application/useForum";
import { useAuthStore } from "@/store/useAuthStore";

export default function SubjectQuestionsScreen() {
  const { subjectId, name } = useLocalSearchParams<{ subjectId: string; name?: string }>();
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const subjectName = name ? decodeURIComponent(name) : "Asignatura";
  const { questions, loading, createQuestion, refresh } = useForum(subjectId);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const role = useAuthStore((s) => s.user?.role);

  const handleCreate = useCallback(async () => {
    if (!subjectId) return;
    if (!title.trim()) { Alert.alert("Validación", "El título es requerido."); return; }
    if (!body.trim()) { Alert.alert("Validación", "El contenido es requerido."); return; }
    setSubmitting(true);
    try {
      await createQuestion(title, body);
      setShowForm(false);
      setTitle("");
      setBody("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Error al publicar.");
    } finally {
      setSubmitting(false);
    }
  }, [subjectId, title, body, createQuestion]);

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: subjectName, headerBackTitle: "Foro" }} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>{subjectName}</Text>
      </View>

      <TouchableOpacity
        style={[styles.newBtn, { backgroundColor: C.primary }]}
        onPress={() => setShowForm(!showForm)}
      >
        <Ionicons name={showForm ? "close" : "add"} size={20} color="#fff" />
        <Text style={styles.newBtnText}>{showForm ? "Cancelar" : "Nueva pregunta"}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={[styles.form, { backgroundColor: C.surface, borderColor: C.border }]}>
          <TextInput
            style={[styles.input, { color: C.text, borderColor: C.border }]}
            placeholder="Título"
            placeholderTextColor={C.tabIconDefault}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
          <TextInput
            style={[styles.textArea, { color: C.text, borderColor: C.border }]}
            placeholder="Escribe tu pregunta..."
            placeholderTextColor={C.tabIconDefault}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: C.primary }]}
            onPress={handleCreate}
            disabled={submitting || !title.trim() || !body.trim()}
          >
            <Text style={styles.submitText}>{submitting ? "Publicando..." : "Publicar"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 32 }} />}

      {!loading && questions.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color={C.tabIconDefault} />
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>No hay preguntas aún.</Text>
        </View>
      )}

      <FlatList
        data={questions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={() => router.push(`/foro/pregunta/${item.id}` as any)}
          >
            <View style={{ flex: 1 }}>
              {item.status === "solved" && (
                <View style={styles.solvedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                  <Text style={styles.solvedText}>Solucionado</Text>
                </View>
              )}
              <Text style={[styles.cardTitle, { color: C.text }]}>{item.title}</Text>
              <View style={styles.meta}>
                <Ionicons name="chatbubble-outline" size={14} color={C.tabIconDefault} />
                <Text style={[styles.metaText, { color: C.tabIconDefault }]}>{item.answer_count}</Text>
                <Text style={[styles.metaText, { color: C.tabIconDefault }]}>· {item.vote_count} votos</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.tabIconDefault} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  newBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  form: { marginHorizontal: 16, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  textArea: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  submitBtn: { paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  solvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  solvedText: { fontSize: 10, fontWeight: "600", color: "#16a34a" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  metaText: { fontSize: 12 },
});
