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

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  cancelled: "Cancelado",
  finished: "Finalizado",
  deleted: "Eliminado",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#f59e0b",
  published: "#22c55e",
  cancelled: "#ef4444",
  finished: "#6b7280",
  deleted: "#dc2626",
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
  onPublish?: () => void;
  onCancel?: () => void;
  C: typeof Colors["light"];
}

export function EventRow({ item, onEdit, onDelete, onPublish, onCancel, C }: EventRowProps) {
  const { fadeAnim, slideAnim } = useEntryAnim();
  const catColor = categoryColor(item.category);
  const st = item.deleted_at ? "deleted" : (item.status ?? "published");

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
            <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[st] ?? "#6b7280") + "18" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLORS[st] ?? "#6b7280" }]}>
                {STATUS_LABELS[st] ?? st}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: catColor + "18" }]}>
              <Text style={[styles.badgeText, { color: catColor }]}>{categoryLabel(item.category)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: C.border }]}>
              <Text style={[styles.badgeText, { color: C.textSecondary }]}>por {item.creator_name}</Text>
            </View>
          </View>

          {st !== "deleted" && (
          <View style={[styles.tagsRow, { marginTop: 8 }]}> 
            {st === "draft" && onPublish && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#22c55e20" }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPublish();
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionText, { color: "#22c55e" }]}>Publicar</Text>
              </TouchableOpacity>
            )}
            {st === "published" && onCancel && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#ef444420" }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onCancel();
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionText, { color: "#ef4444" }]}>Cancelar</Text>
              </TouchableOpacity>
            )}
            {st === "draft" && (
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
            )}
            {st !== "published" && st !== "deleted" && (
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
            )}
          </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
