import { Colors } from "@/constants/Colors";
import type { AdminUser } from "@/types";
import * as Haptics from "expo-haptics";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { getTimeAgo, styles, useEntryAnim } from "./shared";

const ROLE_COLORS: Record<string, string> = { admin: "#7c3aed", estudiante: "#2563eb" };
const ROLE_BG: Record<string, string> = { admin: "#7c3aed20", estudiante: "#2563eb20" };
const ROLE_LABEL: Record<string, string> = { admin: "🛡️ Admin", estudiante: "🎓 Estudiante" };

interface UserRowProps {
  item: AdminUser;
  onToggleRole: () => void;
  onToggleActive: () => void;
  C: typeof Colors["light"];
}

export function UserRow({ item, onToggleRole, onToggleActive, C }: UserRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim();
  const initials = item.full_name
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
              {item.full_name}
            </Text>
            <Text style={[styles.meta, { color: C.textSecondary, marginTop: 0 }]}>{getTimeAgo(item.created_at)}</Text>
          </View>
          <Text style={[styles.meta, { color: C.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>

          <View style={[styles.tagsRow, { marginTop: 6 }]}> 
            <View style={[styles.badge, { backgroundColor: item.is_active ? "#22c55e20" : "#ef444420" }]}>
              <Text style={[styles.badgeText, { color: item.is_active ? "#22c55e" : "#ef4444" }]}>
                {item.is_active ? "Activo" : "Inactivo"}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: ROLE_BG[item.role] ?? C.border }]}>
              <Text style={[styles.badgeText, { color: ROLE_COLORS[item.role] ?? C.textSecondary }]}>
                {ROLE_LABEL[item.role] ?? item.role}
              </Text>
            </View>
          </View>

          <View style={[styles.tagsRow, { marginTop: 8 }]}> 
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleRole();
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, { color: C.primary }]}>
                {item.role === "admin" ? "Hacer Estudiante" : "Hacer Admin"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: item.is_active ? C.errorBackground : "#22c55e15" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onToggleActive();
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, { color: item.is_active ? C.error : "#22c55e" }]}>
                {item.is_active ? "Suspender" : "Activar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
