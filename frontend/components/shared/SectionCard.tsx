/**
 * components/shared/SectionCard.tsx
 *
 * Contenedor de sección con título, acción opcional y borde temático.
 * Reutilizado en: perfil, editar-perfil, admin panel.
 */

import { Colors } from "@/constants/Colors"
import { ReactNode } from "react"
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

interface Props {
  title: string
  actionLabel?: string
  onAction?: () => void
  children: ReactNode
}

export function SectionCard({ title, actionLabel, onAction, children }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.textPrimary }]}>{title}</Text>
        {actionLabel && onAction && (
          <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
            <Text style={[styles.action, { color: C.primary }]}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: "700" },
  action: { fontSize: 13, fontWeight: "600" },
})
