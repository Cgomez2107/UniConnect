/**
 * components/shared/StatBox.tsx
 *
 * Caja de estadística: número grande + etiqueta.
 * Reutilizado en: perfil, (futuro) dashboard admin.
 *
 * Uso:
 *   <StatBox label="Publicaciones" value="3" />
 */

import { Colors } from "@/constants/Colors"
import { StyleSheet, Text, useColorScheme, View } from "react-native"

interface Props {
  label: string
  value: string
}

export function StatBox({ label, value }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={styles.box}>
      <Text style={[styles.value, { color: C.primary }]}>{value}</Text>
      <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: "center", paddingVertical: 16 },
  value: { fontSize: 20, fontWeight: "800" },
  label: { fontSize: 11, marginTop: 2 },
})
