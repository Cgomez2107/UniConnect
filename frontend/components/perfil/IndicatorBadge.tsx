import { Colors } from "@/constants/Colors"
import { StyleSheet, Text, useColorScheme, View } from "react-native"

interface Props {
  icon: string
  label: string
  value: number
}

export function IndicatorBadge({ icon, label, value }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: C.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
  },
  icon: { fontSize: 22 },
  value: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 11, textAlign: "center" },
})
