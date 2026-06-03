import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";
import { useForumQuestion } from "@/hooks/application/useForum";
import { useAuthStore } from "@/store/useAuthStore";

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const { question, answers, loading, error, createAnswer, castVote, markAsSolution, pinAnswer, refresh } = useForumQuestion(id);
  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answerBody.trim()) return;
    setSubmitting(true);
    try {
      await createAnswer(answerBody.trim());
      setAnswerBody("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Error al enviar respuesta.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (targetType: "question" | "answer", targetId: string) => {
    try {
      await castVote(targetType, targetId);
    } catch {
      Alert.alert("Error", "No se pudo registrar el voto.");
    }
  };

  const handleMarkSolution = (answerId: string) => {
    Alert.alert("Marcar como solución", "¿Confirmas que esta respuesta es la solución?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => markAsSolution(answerId).catch(() => {}) },
    ]);
  };

  const handlePinAnswer = (answerId: string) => {
    Alert.alert("Fijar respuesta", "¿Fijar esta respuesta como respuesta del profesor?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Fijar", onPress: () => pinAnswer(answerId).catch(() => {}) },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top, justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (error || !question) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: "Error" }} />
        <View style={styles.empty}>
          <Text style={{ color: C.textSecondary }}>{error || "Pregunta no encontrada."}</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: C.primary }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: question.title.slice(0, 40), headerBackTitle: "Foro" }} />

      <FlatList
        data={answers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={() => (
          <View style={[styles.questionCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => handleVote("question", question.id)} style={styles.voteCol}>
                <Ionicons
                  name="chevron-up"
                  size={24}
                  color={question.user_vote === "upvote" ? C.primary : C.tabIconDefault}
                />
                <Text style={[styles.voteCount, { color: C.text }]}>{question.vote_count}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                {question.status === "solved" && (
                  <View style={styles.solvedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                    <Text style={styles.solvedText}>Solucionado</Text>
                  </View>
                )}
                <Text style={[styles.questionTitle, { color: C.text }]}>{question.title}</Text>
                <Text style={[styles.questionBody, { color: C.textSecondary }]}>{question.body}</Text>
                <View style={styles.meta}>
                  <Text style={[styles.metaText, { color: C.tabIconDefault }]}>{question.vote_count} votos</Text>
                  <Text style={[styles.metaText, { color: C.tabIconDefault }]}>· {question.answer_count} respuestas</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={[styles.answerForm, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Tu respuesta</Text>
            <TextInput
              style={[styles.textArea, { color: C.text, borderColor: C.border }]}
              placeholder="Escribe tu respuesta..."
              placeholderTextColor={C.tabIconDefault}
              value={answerBody}
              onChangeText={setAnswerBody}
              multiline
              maxLength={5000}
            />
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: C.primary }]}
              onPress={handleSubmitAnswer}
              disabled={submitting || !answerBody.trim()}
            >
              <Text style={styles.submitText}>{submitting ? "Enviando..." : "Responder"}</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.answerCard,
              {
                backgroundColor: item.is_pinned ? "#fefce8" : C.surface,
                borderColor: item.is_pinned ? "#fde047" : C.border,
              },
            ]}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => handleVote("answer", item.id)} style={styles.voteCol}>
                <Ionicons
                  name="chevron-up"
                  size={20}
                  color={item.user_vote === "upvote" ? C.primary : C.tabIconDefault}
                />
                <Text style={[styles.voteCountSm, { color: C.text }]}>{item.vote_count}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Text style={[styles.authorName, { color: C.textSecondary }]}>{item.author_name}</Text>
                  {item.is_pinned && (
                    <View style={styles.pinnedBadge}>
                      <Ionicons name="pin" size={10} color="#ca8a04" />
                      <Text style={styles.pinnedText}>Respuesta del Profesor</Text>
                    </View>
                  )}
                  {item.is_solution && (
                    <View style={styles.solvedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                      <Text style={styles.solvedText}>Solución</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.answerBody, { color: C.textSecondary }]}>{item.body}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  {isAdmin && !item.is_solution && !item.is_pinned && (
                    <>
                      <TouchableOpacity onPress={() => handleMarkSolution(item.id)}>
                        <Text style={{ fontSize: 12, color: C.primary, fontWeight: "600" }}>
                          Marcar como solución
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handlePinAnswer(item.id)}>
                        <Text style={{ fontSize: 12, color: "#ca8a04", fontWeight: "600" }}>
                          Fijar respuesta
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  questionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  questionTitle: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  questionBody: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  voteCol: { alignItems: "center", minWidth: 32 },
  voteCount: { fontSize: 14, fontWeight: "700" },
  voteCountSm: { fontSize: 12, fontWeight: "700" },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef9c3",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pinnedText: { fontSize: 10, fontWeight: "600", color: "#ca8a04" },
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
  authorName: { fontSize: 12, fontWeight: "500" },
  meta: { flexDirection: "row", gap: 8, marginTop: 12 },
  metaText: { fontSize: 12 },
  answerCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  answerBody: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  answerForm: { padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 8, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "600" },
  textArea: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  submitBtn: { paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
