/**
 * components/shared/EmptyState.tsx
 *
 * Estado vacío o de error reutilizable:
 * - Feed vacío
 * - Sin materias
 * - Error con botón de reintentar
 *
 * Props:
 *   emoji    — ícono grande (ej: "🔍", "⚠️", "📭")
 *   title    — título principal
 *   body     — descripción
 *   action   — label del botón (opcional)
 *   onAction — callback del botón (opcional)
 */

import { Colors } from "@/constants/Colors"
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

interface Props {
  emoji: string
  title: string
  body?: string
  action?: string
  onAction?: () => void
}

export function EmptyState({ emoji, title, body, action, onAction }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: C.textPrimary }]}>{title}</Text>
      {body ? (
        <Text style={[styles.body, { color: C.textSecondary }]}>{body}</Text>
      ) : null}
      {action && onAction ? (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: C.primary }]}
          onPress={onAction}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: C.textOnPrimary }]}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emoji: { fontSize: 40, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  body: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  btn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: { fontSize: 14, fontWeight: "600" },
})
