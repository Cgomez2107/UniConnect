import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { DIContainer } from "@/lib/services/di/container";

interface SubjectInfo {
  subjectId: string;
  subject_name: string;
}

export default function ForumScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      try {
        const mySubjects = await DIContainer.getInstance().getProfileRepository().getMySubjects(userId);
        const mapped = mySubjects.map((s: any) => ({
          subjectId: s.subject_id ?? s.subjectId ?? s.id,
          subject_name: s.subject?.name ?? s.subject_name ?? "Desconocida",
        }));
        setSubjects(mapped);
      } catch {
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return (
    <View style={[styles.container, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Foro</Text>
        <Text style={[styles.subtitle, { color: C.textSecondary }]}>
          Preguntas y respuestas por asignatura
        </Text>
      </View>

      {loading && (
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
      )}

      {!loading && subjects.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={48} color={C.tabIconDefault} />
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>
            No tienes asignaturas matriculadas.
          </Text>
        </View>
      )}

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.subjectId}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={() => router.push(`/foro/${item.subjectId}?name=${encodeURIComponent(item.subject_name)}` as any)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: C.text }]}>{item.subject_name}</Text>
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
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 4 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "600" },
});
