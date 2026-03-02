/**
 * components/feed/SearchBar.tsx
 *
 * Barra de búsqueda con botón de filtros y badge de filtros activos.
 */

import { Colors } from "@/constants/Colors"
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"

interface Props {
  value: string
  onChangeText: (v: string) => void
  onClear: () => void
  activeFilters: number
  onOpenFilters: () => void
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  activeFilters,
  onOpenFilters,
}: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={[styles.row, { borderBottomColor: C.border }]}>
      <View style={[styles.box, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={{ color: C.textPlaceholder, marginRight: 6 }}>🔍</Text>
        <TextInput
          style={[styles.input, { color: C.textPrimary }]}
          placeholder="Buscar por materia o título..."
          placeholderTextColor={C.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear}>
            <Text style={{ color: C.textSecondary, fontSize: 18, lineHeight: 20 }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.filterBtn,
          {
            backgroundColor: activeFilters > 0 ? C.primary : C.surface,
            borderColor: C.border,
          },
        ]}
        onPress={onOpenFilters}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 16 }}>⚙️</Text>
        {activeFilters > 0 && (
          <View style={[styles.badge, { backgroundColor: C.accent }]}>
            <Text style={[styles.badgeText, { color: C.primary }]}>{activeFilters}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  box: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  input: { flex: 1, fontSize: 14 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
})
