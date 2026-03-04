/**
 * components/ui/CardSolicitud.tsx
 * Tarjeta de solicitud de estudio para el feed
 */

import { Colors } from "@/constants/Colors";
import { StudyRequest } from "@/types";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

interface CardSolicitudProps {
  item: StudyRequest;
  onPress: (item: StudyRequest) => void;
  onPostulate?: (item: StudyRequest) => void;
  isOwnPost?: boolean;
}

const MODALITY_LABEL = {
  presencial: "📍 Presencial",
  virtual: "💻 Virtual",
  híbrido: "🔄 Híbrido",
};

export function CardSolicitud({
  item,
  onPress,
  onPostulate,
  isOwnPost = false,
}: CardSolicitudProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  const timeAgo = getTimeAgo(item.created_at);
  const authorName = item.profiles?.full_name ?? "Estudiante";
  const initials = authorName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.92}
    >
      {/* ── Header: avatar + autor + tiempo ──────────────────────────── */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: C.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: C.primary }]}>{initials}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.authorName, { color: C.textPrimary }]}>
            {authorName}
          </Text>
          <Text style={[styles.authorMeta, { color: C.textSecondary }]}>
            Estudiante · {timeAgo}
          </Text>
        </View>

        {/* Badge de estado */}
        {item.status === "abierta" ? (
          <View style={[styles.badge, { backgroundColor: C.success + "20" }]}>
            <Text style={[styles.badgeText, { color: C.success }]}>Abierta</Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: C.border }]}>
            <Text style={[styles.badgeText, { color: C.textSecondary }]}>Cerrada</Text>
          </View>
        )}
      </View>

      {/* ── Materia tag ───────────────────────────────────────────────── */}
      <View style={[styles.subjectTag, { backgroundColor: C.primary + "12" }]}>
        <Text style={[styles.subjectText, { color: C.primary }]}>
          {item.subject_name}
        </Text>
      </View>

      {/* ── Título y descripción ──────────────────────────────────────── */}
      <Text style={[styles.title, { color: C.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.description, { color: C.textSecondary }]} numberOfLines={3}>
        {item.description}
      </Text>

      {/* ── Footer: modalidad + miembros + botón ─────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerMeta, { color: C.textSecondary }]}>
            {MODALITY_LABEL[item.modality]}
          </Text>
          <Text style={[styles.footerDot, { color: C.border }]}>·</Text>
          <Text style={[styles.footerMeta, { color: C.textSecondary }]}>
            👥 {item.applications_count ?? 0}/{item.max_members}
          </Text>
        </View>

        {!isOwnPost && item.status === "abierta" && (
          <TouchableOpacity
            style={[styles.postulateBtn, { backgroundColor: C.primary }]}
            onPress={() => onPostulate?.(item)}
            activeOpacity={0.85}
          >
            <Text style={[styles.postulateBtnText, { color: C.textOnPrimary }]}>
              Postularme
            </Text>
          </TouchableOpacity>
        )}

        {isOwnPost && (
          <View style={[styles.ownBadge, { borderColor: C.accent }]}>
            <Text style={[styles.ownBadgeText, { color: C.accent }]}>Tu post</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  headerInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: "600" },
  authorMeta: { fontSize: 12, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },

  subjectTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  subjectText: { fontSize: 12, fontWeight: "600" },

  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerMeta: { fontSize: 12 },
  footerDot: { fontSize: 12 },

  postulateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 7,
  },
  postulateBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  ownBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  ownBadgeText: { fontSize: 12, fontWeight: "600" },
});