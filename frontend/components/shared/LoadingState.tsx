/**
 * components/shared/LoadingState.tsx
 *
 * Spinner centrado con mensaje opcional.
 * Reutilizado en cualquier pantalla mientras carga datos.
 */

import { Colors } from "@/constants/Colors"
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from "react-native"

interface Props {
  message?: string
}

export function LoadingState({ message }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={C.primary} />
      {message ? (
        <Text style={[styles.text, { color: C.textSecondary }]}>{message}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  text: { fontSize: 14 },
})
