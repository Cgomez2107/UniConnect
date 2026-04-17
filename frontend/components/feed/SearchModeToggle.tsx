/**
 * Selector de modo de búsqueda del feed.
 * Permite alternar entre solicitudes, compañeros y recursos.
 */

import { Colors } from "@/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { Animated, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native"

export type SearchMode = "solicitudes" | "compañeros" | "recursos"

const MODES: SearchMode[] = ["solicitudes", "compañeros", "recursos"]
const MODE_META: Record<SearchMode, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  solicitudes: { label: "Solicitudes", icon: "document-text-outline" },
  "compañeros": { label: "Compañeros", icon: "people-outline" },
  recursos: { label: "Recursos", icon: "library-outline" },
}

interface Props {
  mode: SearchMode
  onChangeMode: (mode: SearchMode) => void
}

export const SearchModeToggle = memo(function SearchModeToggle({ mode, onChangeMode }: Props) {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]
  const activeIndex = MODES.indexOf(mode)
  const anim = useRef(new Animated.Value(activeIndex)).current
  const [tabWidth, setTabWidth] = useState(0)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setTabWidth(e.nativeEvent.layout.width / 3)
  }, [])

  useEffect(() => {
    Animated.spring(anim, {
      toValue: activeIndex,
      speed: 14,
      bounciness: 6,
      useNativeDriver: true,
    }).start()
  }, [activeIndex])

  const translateX = tabWidth
    ? anim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0, tabWidth, tabWidth * 2],
      })
    : undefined

  return (
    <View
      style={[styles.container, { backgroundColor: C.surface, borderColor: C.border }]}
      onLayout={handleLayout}
    >
      {/* Pill deslizante */}
      {tabWidth > 0 && translateX && (
        <Animated.View
          style={[
            styles.pill,
            { backgroundColor: C.primary, width: tabWidth, transform: [{ translateX }] },
          ]}
        />
      )}

      {MODES.map((m) => (
        <TouchableOpacity
          key={m}
          style={styles.tab}
          onPress={() => onChangeMode(m)}
          activeOpacity={0.8}
        >
          <View style={styles.tabInline}>
            <Ionicons
              name={MODE_META[m].icon}
              size={14}
              color={mode === m ? C.textOnPrimary : C.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: mode === m ? C.textOnPrimary : C.textSecondary },
              ]}
            >
              {MODE_META[m].label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    zIndex: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
})
