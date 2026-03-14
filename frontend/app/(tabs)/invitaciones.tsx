import { ResourceCard } from "@/components/feed/ResourceCard";
import { Colors } from "@/constants/Colors";
import {
  getMyApplications,
  getMyRequests,
  getReceivedApplications,
  reviewApplication,
} from "@/lib/services/careerService";
import { getMyResources } from "@/lib/services/resourceService";
import { useAuthStore } from "@/store/useAuthStore";
import type { Application, StudyRequest, StudyResource } from "@/types";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MainTab = "mis-solicitudes" | "mis-postulaciones" | "mis-recursos";
type SentFilter = "pendiente" | "aceptada" | "rechazada";

const MAIN_TABS: { key: MainTab; label: string; emoji: string }[] = [
  { key: "mis-solicitudes", label: "Mis solicitudes", emoji: "🧩" },
  { key: "mis-postulaciones", label: "Mis postulaciones", emoji: "📬" },
  { key: "mis-recursos", label: "Mis recursos", emoji: "📚" },
];

const SENT_TABS: { key: SentFilter; label: string; emoji: string }[] = [
  { key: "pendiente", label: "Pendientes", emoji: "🕐" },
  { key: "aceptada", label: "Aceptadas", emoji: "✅" },
  { key: "rechazada", label: "Rechazadas", emoji: "❌" },
];

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

interface RequestWithApplications {
  request: StudyRequest;
  applications: Application[];
}

export default function SolicitudesHubScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<MainTab>("mis-solicitudes");
  const [sentFilter, setSentFilter] = useState<SentFilter>("pendiente");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [myRequests, setMyRequests] = useState<StudyRequest[]>([]);
  const [receivedApplications, setReceivedApplications] = useState<Application[]>([]);
  const [sentApplications, setSentApplications] = useState<Application[]>([]);
  const [myResources, setMyResources] = useState<StudyResource[]>([]);

  const loadHub = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return;
      isRefresh ? setRefreshing(true) : setLoading(true);

      try {
        const [requests, received, sent, resources] = await Promise.all([
          getMyRequests(user.id),
          getReceivedApplications(user.id),
          getMyApplications(user.id),
          getMyResources(user.id, 0, 50),
        ]);

        setMyRequests(requests);
        setReceivedApplications(received);
        setSentApplications(sent);
        setMyResources(resources);
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "No se pudo cargar tu espacio de solicitudes.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      loadHub();
    }, [loadHub])
  );

  const requestsWithApplications: RequestWithApplications[] = useMemo(() => {
    const byRequest = new Map<string, Application[]>();
    for (const app of receivedApplications) {
      const current = byRequest.get(app.request_id) ?? [];
      current.push(app);
      byRequest.set(app.request_id, current);
    }

    return myRequests.map((request) => ({
      request,
      applications: byRequest.get(request.id) ?? [],
    }));
  }, [myRequests, receivedApplications]);

  const filteredSent = useMemo(
    () => sentApplications.filter((app) => app.status === sentFilter),
    [sentApplications, sentFilter]
  );

  const counts = useMemo(() => {
    const pendingReceived = receivedApplications.filter((a) => a.status === "pendiente").length;
    const acceptedSent = sentApplications.filter((a) => a.status === "aceptada").length;
    const pendingSent = sentApplications.filter((a) => a.status === "pendiente").length;

    return {
      pendingReceived,
      acceptedSent,
      pendingSent,
    };
  }, [receivedApplications, sentApplications]);

  const handleReview = (applicationId: string, status: "aceptada" | "rechazada") => {
    if (!user?.id) {
      Alert.alert("Sesion requerida", "Debes iniciar sesion para gestionar solicitudes.");
      return;
    }

    const confirmTitle = status === "aceptada" ? "Aceptar postulación" : "Rechazar postulación";
    const confirmBody =
      status === "aceptada"
        ? "¿Quieres aceptar a este estudiante en tu solicitud?"
        : "¿Quieres rechazar esta postulación?";

    Alert.alert(confirmTitle, confirmBody, [
      { text: "Cancelar", style: "cancel" },
      {
        text: status === "aceptada" ? "Aceptar" : "Rechazar",
        style: status === "rechazada" ? "destructive" : "default",
        onPress: async () => {
          setActionId(applicationId);
          try {
            await reviewApplication(user.id, applicationId, status);
            setReceivedApplications((prev) =>
              prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
            );
            setSentApplications((prev) =>
              prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
            );
          } catch (e: any) {
            Alert.alert("Error", e.message ?? "No se pudo actualizar la postulación.");
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const openApplicantProfile = (applicantId: string) => {
    if (!applicantId) return;
    router.push(`/perfil-estudiante/${applicantId}` as any);
  };

  const renderRequestCard = ({ item }: { item: RequestWithApplications }) => {
    const pending = item.applications.filter((a) => a.status === "pendiente").length;
    const accepted = item.applications.filter((a) => a.status === "aceptada").length;
    const rejected = item.applications.filter((a) => a.status === "rechazada").length;

    return (
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <TouchableOpacity
          onPress={() => router.push(`/solicitud/${item.request.id}` as any)}
          activeOpacity={0.8}
        >
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
                    <TouchableOpacity onPress={() => openApplicantProfile(app.applicant_id)} activeOpacity={0.75}>
                      <Text style={[styles.applicantName, { color: C.textPrimary }]}>{applicantName}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.applicantMeta, { color: C.textSecondary }]}>{timeAgo(app.created_at)}</Text>
                  </View>

                  {!isPending && (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            app.status === "aceptada" ? C.success + "20" : C.error + "15",
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
                  "{app.message}"
                </Text>

                {isPending && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnGhost, { borderColor: C.error }]}
                      onPress={() => handleReview(app.id, "rechazada")}
                      disabled={isActionLoading}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.btnGhostText, { color: C.error }]}>Rechazar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: isActionLoading ? C.border : C.primary }]}
                      onPress={() => handleReview(app.id, "aceptada")}
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
  };

  const renderSentCard = ({ item }: { item: Application }) => {
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
          "{item.message}"
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
            onPress={() => router.push(`/solicitud/${item.request_id}` as any)}
            activeOpacity={0.8}
          >
            <Text style={[styles.linkBtnText, { color: C.textPrimary }]}>Ver solicitud</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderResourcesCard = ({ item }: { item: StudyResource }) => (
    <View style={{ paddingHorizontal: 12 }}>
      <ResourceCard
        item={item}
        isOwn
        onOpen={(resource) => router.push(`/recurso/${resource.id}` as any)}
      />
    </View>
  );

  const listData =
    activeTab === "mis-solicitudes"
      ? requestsWithApplications
      : activeTab === "mis-postulaciones"
      ? filteredSent
      : myResources;

  return (
    <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: C.border }]}> 
        <Text style={[styles.title, { color: C.textPrimary }]}>Solicitudes</Text>
        <Text style={[styles.subTitle, { color: C.textSecondary }]}> 
          {counts.acceptedSent} aceptadas · {counts.pendingSent} pendientes · {counts.pendingReceived} por revisar
        </Text>
      </View>

      <View style={[styles.mainTabsWrap, { borderBottomColor: C.border }]}> 
        {MAIN_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.mainTab,
                { borderBottomColor: active ? C.primary : "transparent" },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.mainTabText, { color: active ? C.primary : C.textSecondary }]}> 
                {tab.emoji} {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === "mis-postulaciones" && (
        <View style={[styles.sentTabsWrap, { borderBottomColor: C.border }]}> 
          {SENT_TABS.map((tab) => {
            const active = sentFilter === tab.key;
            const count = sentApplications.filter((a) => a.status === tab.key).length;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.sentTab, { backgroundColor: active ? C.primary + "15" : "transparent", borderColor: C.border }]}
                onPress={() => setSentFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sentTabText, { color: active ? C.primary : C.textSecondary }]}> 
                  {tab.emoji} {tab.label} {count > 0 ? `(${count})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {activeTab === "mis-recursos" && (
        <View style={styles.resourcesActions}> 
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: C.primary }]}
            onPress={() => router.push("/subir-recurso" as any)}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryActionText, { color: C.textOnPrimary }]}>+ Subir recurso</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={listData as any[]}
          keyExtractor={(item: any) => item.id ?? item.request?.id}
          renderItem={(args: any) => {
            if (activeTab === "mis-solicitudes") return renderRequestCard(args);
            if (activeTab === "mis-postulaciones") return renderSentCard(args);
            return renderResourcesCard(args);
          }}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 80 },
            listData.length === 0 ? styles.listEmpty : null,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHub(true)}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}> 
              <Text style={{ fontSize: 44 }}>
                {activeTab === "mis-solicitudes" ? "🧩" : activeTab === "mis-postulaciones" ? "📭" : "📚"}
              </Text>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}> 
                {activeTab === "mis-solicitudes"
                  ? "Aun no tienes solicitudes publicadas"
                  : activeTab === "mis-postulaciones"
                  ? "Sin postulaciones en este estado"
                  : "Aun no has subido recursos"}
              </Text>
              <Text style={[styles.emptyBody, { color: C.textSecondary }]}> 
                {activeTab === "mis-solicitudes"
                  ? "Crea una solicitud para empezar a recibir postulantes."
                  : activeTab === "mis-postulaciones"
                  ? "Tus postulaciones aceptadas, pendientes o rechazadas apareceran aqui."
                  : "Desde aqui podras gestionar los recursos que compartas."}
              </Text>
              {activeTab === "mis-solicitudes" && (
                <TouchableOpacity
                  style={[styles.primaryAction, { backgroundColor: C.primary }]}
                  onPress={() => router.push("/nueva-solicitud" as any)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryActionText, { color: C.textOnPrimary }]}>+ Nueva solicitud</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  subTitle: { fontSize: 13, marginTop: 2 },

  mainTabsWrap: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  mainTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderBottomWidth: 2,
  },
  mainTabText: { fontSize: 12, fontWeight: "700", textAlign: "center" },

  sentTabsWrap: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sentTab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    alignItems: "center",
  },
  sentTabText: { fontSize: 12, fontWeight: "700" },

  resourcesActions: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  list: {
    padding: 12,
    gap: 12,
  },
  listEmpty: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 320 },

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

  primaryAction: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "center",
  },
  primaryActionText: { fontSize: 14, fontWeight: "700" },
});