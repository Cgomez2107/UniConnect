import { ResourceCard } from "@/components/feed/ResourceCard";
import { Colors } from "@/constants/Colors";
import type { RequestWithApplications } from "@/hooks/application/useInvitationsHub";
import type { Application, StudyResource } from "@/types";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

interface RequestApplicationsCardProps {
  item: RequestWithApplications;
  C: (typeof Colors)["light"];
  actionId: string | null;
  onOpenRequest: (requestId: string) => void;
  onOpenApplicantProfile: (applicantId: string) => void;
  onReview: (applicationId: string, status: "aceptada" | "rechazada") => void;
}

export function RequestApplicationsCard({
  item,
  C,
  actionId,
  onOpenRequest,
  onOpenApplicantProfile,
  onReview,
}: RequestApplicationsCardProps) {
  const pending = item.applications.filter((a) => a.status === "pendiente").length;
  const accepted = item.applications.filter((a) => a.status === "aceptada").length;
  const rejected = item.applications.filter((a) => a.status === "rechazada").length;

  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <TouchableOpacity onPress={() => onOpenRequest(item.request.id)} activeOpacity={0.8}>
        <Text style={[styles.cardTitle, { color: C.textPrimary }]} numberOfLines={2}>
          {item.request.title}
        </Text>
        <Text style={[styles.cardMeta, { color: C.textSecondary }]} numberOfLines={1}>
          {item.request.subjects?.name ?? "Sin materia"} · {item.request.status}
        </Text>
      </TouchableOpacity>

      <View style={styles.rowStats}>
        <View style={[styles.statChip, { backgroundColor: C.primary + "20" }]}>
          <Text style={[styles.statText, { color: C.primary }]}>🕐 {pending} pendientes</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: C.success + "20" }]}>
          <Text style={[styles.statText, { color: C.success }]}>✅ {accepted} aceptadas</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: C.error + "15" }]}>
          <Text style={[styles.statText, { color: C.error }]}>❌ {rejected} rechazadas</Text>
        </View>
      </View>

      {item.applications.length === 0 ? (
        <View style={[styles.innerEmpty, { borderColor: C.border }]}>
          <Text style={[styles.innerEmptyText, { color: C.textSecondary }]}>Aun no tienes postulantes.</Text>
        </View>
      ) : (
        item.applications.map((app) => {
          const applicantName = app.profiles?.full_name ?? "Estudiante";
          const isPending = app.status === "pendiente";
          const isActionLoading = actionId === app.id;

          return (
            <View key={app.id} style={[styles.appRow, { borderColor: C.border }]}>
              <View style={styles.appHeader}>
                <View style={[styles.avatar, { backgroundColor: C.primary + "20" }]}>
                  <Text style={[styles.avatarText, { color: C.primary }]}>{getInitials(applicantName)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => onOpenApplicantProfile(app.applicant_id)} activeOpacity={0.75}>
                    <Text style={[styles.applicantName, { color: C.textPrimary }]}>{applicantName}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.applicantMeta, { color: C.textSecondary }]}>{timeAgo(app.created_at)}</Text>
                </View>

                {!isPending && (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: app.status === "aceptada" ? C.success + "20" : C.error + "15",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: app.status === "aceptada" ? C.success : C.error },
                      ]}
                    >
                      {app.status === "aceptada" ? "Aceptada" : "Rechazada"}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.message, { color: C.textSecondary }]} numberOfLines={2}>
                &quot;{app.message}&quot;
              </Text>

              {isPending && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnGhost, { borderColor: C.error }]}
                    onPress={() => onReview(app.id, "rechazada")}
                    disabled={isActionLoading}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.btnGhostText, { color: C.error }]}>Rechazar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: isActionLoading ? C.border : C.primary }]}
                    onPress={() => onReview(app.id, "aceptada")}
                    disabled={isActionLoading}
                    activeOpacity={0.85}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator size="small" color={C.textOnPrimary} />
                    ) : (
                      <Text style={[styles.btnText, { color: C.textOnPrimary }]}>Aceptar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

interface SentApplicationCardProps {
  item: Application;
  C: (typeof Colors)["light"];
  onOpenRequest: (requestId: string) => void;
}

export function SentApplicationCard({ item, C, onOpenRequest }: SentApplicationCardProps) {
  const reqTitle = item.study_requests?.title ?? "Solicitud";
  const subject = item.study_requests?.subjects?.name ?? "Sin materia";

  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <Text style={[styles.cardTitle, { color: C.textPrimary }]} numberOfLines={2}>
        {reqTitle}
      </Text>
      <Text style={[styles.cardMeta, { color: C.textSecondary }]}>
        {subject} · {timeAgo(item.created_at)}
      </Text>

      <Text style={[styles.message, { color: C.textSecondary }]} numberOfLines={3}>
        &quot;{item.message}&quot;
      </Text>

      <View style={styles.rowStats}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor:
                item.status === "aceptada"
                  ? C.success + "20"
                  : item.status === "rechazada"
                    ? C.error + "15"
                    : C.primary + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              {
                color:
                  item.status === "aceptada"
                    ? C.success
                    : item.status === "rechazada"
                      ? C.error
                      : C.primary,
              },
            ]}
          >
            {item.status === "aceptada"
              ? "✅ Aceptada"
              : item.status === "rechazada"
                ? "❌ Rechazada"
                : "🕐 Pendiente"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.linkBtn, { borderColor: C.border }]}
          onPress={() => onOpenRequest(item.request_id)}
          activeOpacity={0.8}
        >
          <Text style={[styles.linkBtnText, { color: C.textPrimary }]}>Ver solicitud</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface OwnResourceCardProps {
  item: StudyResource;
  onOpenResource: (resourceId: string) => void;
}

export function OwnResourceCard({ item, onOpenResource }: OwnResourceCardProps) {
  return (
    <View style={styles.resourceItemWrap}>
      <ResourceCard item={item} isOwn onOpen={(resource) => onOpenResource(resource.id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  resourceItemWrap: { paddingHorizontal: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
  cardMeta: { fontSize: 13 },

  rowStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  statChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statText: { fontSize: 12, fontWeight: "700" },

  innerEmpty: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  innerEmptyText: { fontSize: 13 },

  appRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "700" },
  applicantName: {
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  applicantMeta: { fontSize: 12 },
  message: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },

  actions: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
  },
  btnGhost: { borderWidth: 1 },
  btnGhostText: { fontSize: 13, fontWeight: "700" },
  btnText: { fontSize: 13, fontWeight: "700" },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusPillText: { fontSize: 12, fontWeight: "700" },

  linkBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  linkBtnText: { fontSize: 12, fontWeight: "700" },
});
