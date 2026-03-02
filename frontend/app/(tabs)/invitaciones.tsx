/**
 * app/(tabs)/invitaciones.tsx
 * Bandeja de solicitudes recibidas — US-010
 * Placeholder hasta el Sprint 2
 */

import { Colors } from "@/constants/Colors";
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function InvitacionesScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <Text style={[styles.title, { color: C.textPrimary }]}>Solicitudes</Text>
        <Text style={[styles.sub, { color: C.textSecondary }]}>
          Postulaciones recibidas a tus publicaciones
        </Text>
      </View>

      <View style={styles.empty}>
        <Text style={styles.emoji}>🔔</Text>
        <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
          Sin notificaciones
        </Text>
        <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
          Cuando alguien se postule a tus grupos de estudio, aparecerá aquí.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 12, marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});