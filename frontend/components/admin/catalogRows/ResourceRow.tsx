import { Colors } from "@/constants/Colors";
import type { AdminResource } from "@/types";
import * as Haptics from "expo-haptics";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { getTimeAgo, styles, useEntryAnim } from "./shared";

const FILE_ICON: Record<string, string> = {
  PDF: "📄",
  DOCX: "📝",
  DOC: "📝",
  XLSX: "📊",
  XLS: "📊",
  PPTX: "📋",
  PPT: "📋",
  TXT: "📃",
  JPG: "🖼️",
  PNG: "🖼️",
};

const FILE_COLOR: Record<string, string> = {
  PDF: "#ef4444",
  DOCX: "#2563eb",
  DOC: "#2563eb",
  XLSX: "#22c55e",
  XLS: "#22c55e",
  PPTX: "#f59e0b",
  PPT: "#f59e0b",
  TXT: "#64748b",
  JPG: "#a855f7",
  PNG: "#a855f7",
};

interface ResourceRowProps {
  item: AdminResource;
  onDelete: () => void;
  C: typeof Colors["light"];
}

export function ResourceRow({ item, onDelete, C }: ResourceRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim();
  const typeKey = item.file_type?.toUpperCase() ?? "";
  const icon = FILE_ICON[typeKey] ?? "📁";
  const color = FILE_COLOR[typeKey] ?? C.textSecondary;
  const sizeLabel = item.file_size_kb
    ? item.file_size_kb >= 1024
      ? `${(item.file_size_kb / 1024).toFixed(1)} MB`
      : `${item.file_size_kb} KB`
    : "";

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border, alignItems: "flex-start" }]}>
        <View style={[styles.fileBox, { backgroundColor: color + "18" }]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>

        <View style={styles.info}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.name, { color: C.textPrimary, flex: 1 }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: C.textSecondary, marginTop: 0 }]}>{getTimeAgo(item.created_at)}</Text>
          </View>

          <Text style={[styles.meta, { color: C.textSecondary }]}>{item.author_name} · 📚 {item.subject_name}</Text>

          <View style={[styles.tagsRow, { marginTop: 6 }]}> 
            {typeKey ? (
              <View style={[styles.badge, { backgroundColor: color + "18" }]}>
                <Text style={[styles.badgeText, { color }]}>{typeKey}</Text>
              </View>
            ) : null}
            {sizeLabel ? (
              <View style={[styles.badge, { backgroundColor: C.border }]}>
                <Text style={[styles.badgeText, { color: C.textSecondary }]}>{sizeLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.errorBackground, alignSelf: "flex-start" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDelete();
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, { color: C.error }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
