/**
 * components/feed/ModalityChips.tsx
 *
 * Chips horizontales para filtrar por modalidad.
 */

import { Colors } from "@/constants/Colors"
import { MODALITIES } from "@/hooks/useFeed"
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

interface Props {
  selected: string
  onSelect: (modality: string) => void
}

export function ModalityChips({ selected, onSelect }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {MODALITIES.map((m) => {
          const isActive = selected === m
          return (
            <TouchableOpacity
              key={m}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? C.primary : C.surface,
                  borderColor: isActive ? C.primary : C.border,
                },
              ]}
              onPress={() => onSelect(m)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? C.textOnPrimary : C.textSecondary },
                ]}
              >
                {m === "Todos" ? "Todos" : m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { height: 52, flexShrink: 0 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 13, fontWeight: "500" },
})
