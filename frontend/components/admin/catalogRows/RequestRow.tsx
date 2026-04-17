import { Colors } from "@/constants/Colors";
import type { AdminRequest } from "@/types";
import * as Haptics from "expo-haptics";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { getTimeAgo, styles, useEntryAnim } from "./shared";

const STATUS_COLOR: Record<string, string> = {
  abierta: "#22c55e",
  cerrada: "#ef4444",
  expirada: "#f59e0b",
};

interface RequestRowProps {
  item: AdminRequest;
  onClose: () => void;
  onDelete: () => void;
  C: typeof Colors["light"];
}

export function RequestRow({ item, onClose, onDelete, C }: RequestRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim();
  const initials = (item.author_name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border, alignItems: "flex-start" }]}>
        <View style={[styles.avatar, { backgroundColor: C.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: C.primary }]}>{initials}</Text>
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
            <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#94a3b8") + "20" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? C.textSecondary }]}>{item.status}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: C.primary + "12" }]}>
              <Text style={[styles.badgeText, { color: C.primary }]}>👥 {item.applications_count} postulaciones</Text>
            </View>
          </View>

          <View style={[styles.tagsRow, { marginTop: 8 }]}> 
            {item.status === "abierta" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionText, { color: C.primary }]}>Cerrar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.errorBackground }]}
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
