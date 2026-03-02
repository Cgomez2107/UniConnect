/**
 * components/feed/FeedHeader.tsx
 *
 * Encabezado del feed: título, contador de resultados y botón "+ Nueva".
 */

import { Colors } from "@/constants/Colors"
import { router } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

interface Props {
  count: number
  loading: boolean
}

export function FeedHeader({ count, loading }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={[styles.header, { borderBottomColor: C.border }]}>
      <View>
        <Text style={[styles.title, { color: C.textPrimary }]}>Solicitudes</Text>
        <Text style={[styles.sub, { color: C.textSecondary }]}>
          {loading ? "Cargando..." : `${count} publicaciones activas`}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: C.accent }]}
        onPress={() => router.push("/nueva-solicitud")}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnText, { color: C.primary }]}>+ Nueva</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 12, marginTop: 2 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnText: { fontSize: 14, fontWeight: "700" },
})
