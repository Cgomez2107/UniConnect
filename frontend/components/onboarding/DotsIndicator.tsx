/**
 * components/onboarding/DotsIndicator.tsx
 *
 * Indicadores de posición (dots) del onboarding.
 * El dot activo se expande a 24px de ancho.
 */

import { Colors } from "@/constants/Colors"
import { StyleSheet, useColorScheme, View } from "react-native"

interface Props {
  total: number
  activeIndex: number
}

export function DotsIndicator({ total, activeIndex }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === activeIndex ? C.primary : C.border,
              width: i === activeIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  dot: { height: 8, borderRadius: 4 },
})
