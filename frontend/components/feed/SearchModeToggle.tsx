/**
 * components/feed/SearchModeToggle.tsx
 * Toggle para alternar entre modos de búsqueda — US-005 + US-006
 *
 * Tres modos:
 *   - "solicitudes": búsqueda normal del feed (por defecto)
 *   - "compañeros": búsqueda de estudiantes por materia
 *   - "recursos": recursos de estudio compartidos
 */

import { Colors } from "@/constants/Colors"
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

export type SearchMode = "solicitudes" | "compañeros" | "recursos"

interface Props {
  mode: SearchMode
  onChangeMode: (mode: SearchMode) => void
}

export function SearchModeToggle({ mode, onChangeMode }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  return (
    <View style={[styles.container, { backgroundColor: C.surface, borderColor: C.border }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          mode === "solicitudes" && { backgroundColor: C.primary },
        ]}
        onPress={() => onChangeMode("solicitudes")}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.tabText,
            { color: mode === "solicitudes" ? C.textOnPrimary : C.textSecondary },
          ]}
        >
          📋 Solicitudes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          mode === "compañeros" && { backgroundColor: C.primary },
        ]}
        onPress={() => onChangeMode("compañeros")}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.tabText,
            { color: mode === "compañeros" ? C.textOnPrimary : C.textSecondary },
          ]}
        >
          👥 Compañeros
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          mode === "recursos" && { backgroundColor: C.primary },
        ]}
        onPress={() => onChangeMode("recursos")}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.tabText,
            { color: mode === "recursos" ? C.textOnPrimary : C.textSecondary },
          ]}
        >
          📚 Recursos
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
})
