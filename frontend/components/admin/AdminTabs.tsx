/**
 * components/admin/AdminTabs.tsx
 * Fila de pestañas: Facultades / Programas / Materias con sus conteos.
 */

import { Colors } from "@/constants/Colors"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export type ActiveTab = "facultades" | "programas" | "materias"

export interface AdminTabItem {
  key: ActiveTab
  emoji: string
  label: string
  count: number
}

interface Props {
  tabs: AdminTabItem[]
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  C: typeof Colors["light"]
}

/**
 * Navegación por pestañas del catálogo académico en el panel admin.
 */
export function AdminTabs({ tabs, activeTab, onTabChange, C }: Props) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && [styles.tabActive, { borderBottomColor: C.primary }],
          ]}
          onPress={() => onTabChange(tab.key)}
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
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
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
