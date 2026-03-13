// Barra de pestañas del panel de administración con scroll horizontal.

import { Colors } from "@/constants/Colors"
import * as Haptics from "expo-haptics"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"

export type ActiveTab = "facultades" | "programas" | "materias" | "usuarios" | "solicitudes" | "recursos" | "metricas" | "eventos"

interface Tab {
  key: ActiveTab
  emoji: string
  label: string
  count: number
}

interface Props {
  tabs: Tab[]
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  C: typeof Colors["light"]
}

export function AdminTabs({ tabs, activeTab, onTabChange, C }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        bounces={false}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.tabActive, { borderBottomColor: C.primary }],
            ]}
            onPress={() => {
              Haptics.selectionAsync()
              onTabChange(tab.key)
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14 }}>{tab.emoji}</Text>
            <Text
              style={[
                styles.label,
                { color: activeTab === tab.key ? C.primary : C.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    activeTab === tab.key ? C.primary + "20" : C.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: activeTab === tab.key ? C.primary : C.textSecondary },
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  tab: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
})
