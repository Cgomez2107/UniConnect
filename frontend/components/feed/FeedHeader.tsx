/**
 * components/feed/FeedHeader.tsx
 *
 * Encabezado del feed: título, contador de resultados y botón "+ Nueva".
 */

import { Colors } from "@/constants/Colors"
import { router } from "expo-router"
import { memo, useCallback } from "react"
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

type SearchMode = "solicitudes" | "compañeros" | "recursos"

const MODE_TITLE: Record<SearchMode, string> = {
  solicitudes: "Solicitudes",
  "compañeros": "Compañeros",
  recursos: "Recursos",
}

interface Props {
  count: number
  loading: boolean
  mode?: SearchMode
}

export const FeedHeader = memo(function FeedHeader({ count, loading, mode = "solicitudes" }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  const openNewRequest = useCallback(() => {
    router.push("/nueva-solicitud")
  }, [])

  return (
    <View style={[styles.header, { borderBottomColor: C.border }]}>
      <View>
        <Text style={[styles.title, { color: C.textPrimary }]}>{MODE_TITLE[mode]}</Text>
        <Text style={[styles.sub, { color: C.textSecondary }]}>
          {loading ? "Cargando..." : `${count} publicaciones activas`}
        </Text>
      </View>
      {mode === "solicitudes" && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: C.accent }]}
          onPress={openNewRequest}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: C.primary }]}>+ Nueva</Text>
        </TouchableOpacity>
      )}
    </View>
  )
})

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
