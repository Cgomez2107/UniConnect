/**
 * components/perfil/MiniRequestCard.tsx
 *
 * Tarjeta compacta para mostrar las solicitudes propias en el perfil.
 */

import { Colors } from "@/constants/Colors"
import { StudyRequest } from "@/types"
import { router } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

interface Props {
  request: StudyRequest
}

export function MiniRequestCard({ request }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  const occupied = Math.max(1, Math.min(request.applications_count ?? 1, request.max_members))
  const available = Math.max(request.max_members - occupied, 0)

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: C.border }]}
      onPress={() => router.push(`/solicitud/${request.id}` as any)}
      activeOpacity={0.85}
    >
      <View style={[styles.tag, { backgroundColor: C.primary + "12" }]}>
        <Text style={[styles.tagText, { color: C.primary }]}>
          {(request as any).subjects?.name ?? "—"}
        </Text>
      </View>
      <Text style={[styles.title, { color: C.textPrimary }]}>{request.title}</Text>
      <Text style={[styles.meta, { color: C.textSecondary }]}>👥 Cupos disponibles: {available}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8 },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  tagText: { fontSize: 11, fontWeight: "600" },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  meta: { fontSize: 12 },
})
