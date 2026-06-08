import { Colors } from "@/constants/Colors";
import type { AdminEvent } from "@/types";
import * as Haptics from "expo-haptics";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { getTimeAgo, styles, useEntryAnim } from "./shared";

const CATEGORY_ICONS: Record<string, string> = {
  academico: "🎓",
  cultural: "🎭",
  deportivo: "⚽",
  otro: "📌",
};

const CATEGORY_COLORS: Record<string, string> = {
  academico: "#2563eb",
  cultural: "#a855f7",
  deportivo: "#22c55e",
  otro: "#f59e0b",
};

const FALLBACK_ICONS = ["📅", "🎯", "📚", "💡", "🎪", "🏆", "🔬", "🎨"];

function categoryIcon(slug: string, index?: number): string {
  return CATEGORY_ICONS[slug] ?? FALLBACK_ICONS[(index ?? 0) % FALLBACK_ICONS.length] ?? "📅";
}

function categoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? "#6b7280";
}

function categoryLabel(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface EventRowProps {
  item: AdminEvent;
  onEdit: () => void;
  onDelete: () => void;
  C: typeof Colors["light"];
}

export function EventRow({ item, onEdit, onDelete, C }: EventRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim();
  const catColor = categoryColor(item.category);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border, alignItems: "flex-start" }]}>
        <View style={[styles.fileBox, { backgroundColor: catColor + "18" }]}>
          <Text style={{ fontSize: 22 }}>{categoryIcon(item.category)}</Text>
        </View>

        <View style={styles.info}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.name, { color: C.textPrimary, flex: 1 }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: C.textSecondary, marginTop: 0 }]}>{getTimeAgo(item.created_at)}</Text>
          </View>

          <Text style={[styles.meta, { color: C.textSecondary }]}>📅 {formatEventDate(item.event_date)}</Text>

          {item.location ? (
            <Text style={[styles.meta, { color: C.textSecondary }]} numberOfLines={1}>
              📍 {item.location}
            </Text>
          ) : null}

          <View style={[styles.tagsRow, { marginTop: 6 }]}> 
            <View style={[styles.badge, { backgroundColor: catColor + "18" }]}>
              <Text style={[styles.badgeText, { color: catColor }]}>{categoryLabel(item.category)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: C.border }]}>
              <Text style={[styles.badgeText, { color: C.textSecondary }]}>por {item.creator_name}</Text>
            </View>
          </View>

          <View style={[styles.tagsRow, { marginTop: 8 }]}> 
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: C.primary + "15" }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onEdit();
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, { color: C.primary }]}>Editar</Text>
            </TouchableOpacity>

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
