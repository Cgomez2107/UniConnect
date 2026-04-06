import { Colors } from "@/constants/Colors";
import { ActiveTab } from "@/components/admin/AdminTabs";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const TABS_WITH_ADD: ActiveTab[] = ["facultades", "programas", "materias", "eventos"];

interface Props {
  activeTab: ActiveTab;
  search: string;
  setSearch: (value: string) => void;
  searchPlaceholder: string;
  onAddPress: () => void;
  C: (typeof Colors)["light"];
}

export function AdminSearchBar({
  activeTab,
  search,
  setSearch,
  searchPlaceholder,
  onAddPress,
  C,
}: Props) {
  return (
    <View style={[styles.searchRow, { borderBottomColor: C.border }]}>
      <View style={[styles.searchBox, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Ionicons name="search-outline" size={16} color={C.textPlaceholder} style={{ marginRight: 6 }} />
        <TextInput
          style={[styles.searchInput, { color: C.textPrimary }]}
          placeholder={searchPlaceholder}
          placeholderTextColor={C.textPlaceholder}
          value={search}
          onChangeText={setSearch}
          editable
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color={C.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {TABS_WITH_ADD.includes(activeTab) && (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: C.primary }]}
          onPress={onAddPress}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 14 },
  addBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
