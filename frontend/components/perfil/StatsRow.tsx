/**
 * components/perfil/StatsRow.tsx
 *
 * Fila de estadísticas del perfil: Publicaciones | Grupos | Materias.
 * Usa StatBox internamente.
 */

import { StatBox } from "@/components/shared/StatBox"
import { Colors } from "@/constants/Colors"
import { StyleSheet, useColorScheme, View } from "react-native"

interface Props {
  requestsCount: number
  subjectsCount: number
  groupsCount?: number
}

export function StatsRow({
  requestsCount,
  subjectsCount,
  groupsCount = 0,
}: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View
      style={[
        styles.row,
        { borderColor: C.border, backgroundColor: C.surface },
      ]}
    >
      <StatBox label="Publicaciones" value={String(requestsCount)} />
      {groupsCount > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <StatBox label="Grupos" value={String(groupsCount)} />
        </>
      )}
      <View style={[styles.divider, { backgroundColor: C.border }]} />
      <StatBox label="Materias" value={String(subjectsCount)} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: { width: 1 },
})
