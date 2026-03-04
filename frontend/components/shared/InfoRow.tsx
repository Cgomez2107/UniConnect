/**
 * components/shared/InfoRow.tsx
 *
 * Fila con emoji, label y valor.
 * Reutilizado en: perfil, editar-perfil.
 *
 * Uso:
 *   <InfoRow emoji="📅" label="Semestre" value="5° semestre" />
 */

import { Colors } from "@/constants/Colors"
import { ReactNode } from "react"
import { StyleSheet, Text, useColorScheme, View } from "react-native"

interface Props {
  emoji: string
  label: string
  /** Texto simple */
  value?: string
  /** Contenido JSX arbitrario (cuando el valor no es texto plano) */
  children?: ReactNode
}

export function InfoRow({ emoji, label, value, children }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.content}>
        <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
        {value !== undefined ? (
          <Text style={[styles.value, { color: C.textPrimary }]}>{value}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 8 },
  emoji: { fontSize: 18, marginRight: 12, marginTop: 2 },
  content: { flex: 1 },
  label: { fontSize: 11, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "500" },
})
