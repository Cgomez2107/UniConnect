import { OwnResourceCard, RequestApplicationsCard, SentApplicationCard } from "@/components/invitaciones/HubCards";
import { Colors } from "@/constants/Colors";
import {
  type MainTab,
  type RequestWithApplications,
  type SentFilter,
  useInvitationsHub,
} from "@/hooks/application/useInvitationsHub";
import type { Application, StudyResource } from "@/types";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function SolicitudesHubScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const {
    activeTab,
    setActiveTab,
    sentFilter,
    setSentFilter,
    loading,
    refreshing,
    actionId,
    sentApplications,
    counts,
    listData,
    loadHub,
    handleReview,
  } = useInvitationsHub();

  const openApplicantProfile = useCallback((applicantId: string) => {
    if (!applicantId) return;
    router.push(`/perfil-estudiante/${applicantId}` as any);
  }, []);

  const openRequest = useCallback((requestId: string) => {
    router.push(`/solicitud/${requestId}` as any);
  }, []);

  const openResource = useCallback((resourceId: string) => {
    router.push(`/recurso/${resourceId}` as any);
  }, []);

  const openUploadResource = useCallback(() => {
    router.push("/subir-recurso" as any);
  }, []);

  const openNewRequest = useCallback(() => {
    router.push("/nueva-solicitud" as any);
  }, []);

  const onRefresh = useCallback(() => {
    loadHub(true);
  }, [loadHub]);

  const sentCounts = useMemo(() => {
    return sentApplications.reduce<Record<SentFilter, number>>(
      (acc, app) => {
        if (app.status === "pendiente" || app.status === "aceptada" || app.status === "rechazada") {
          acc[app.status] += 1;
        }
        return acc;
      },
      { pendiente: 0, aceptada: 0, rechazada: 0 },
    );
  }, [sentApplications]);

  const keyExtractor = useCallback((item: any) => item.id ?? item.request?.id, []);

  const listContentStyle = useMemo(
    () => [styles.list, { paddingBottom: insets.bottom + 80 }, listData.length === 0 ? styles.listEmpty : null],
    [insets.bottom, listData.length],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={[C.primary]}
        tintColor={C.primary}
      />
    ),
    [refreshing, onRefresh, C.primary],
  );

  const renderRequestCard = useCallback(
    ({ item }: { item: RequestWithApplications }) => (
      <RequestApplicationsCard
        item={item}
        C={C}
        actionId={actionId}
        onOpenRequest={openRequest}
        onOpenApplicantProfile={openApplicantProfile}
        onReview={handleReview}
      />
    ),
    [C, actionId, handleReview, openApplicantProfile, openRequest],
  );

  const renderSentCard = useCallback(
    ({ item }: { item: Application }) => (
      <SentApplicationCard item={item} C={C} onOpenRequest={openRequest} />
    ),
    [C, openRequest],
  );

  const renderResourcesCard = useCallback(
    ({ item }: { item: StudyResource }) => <OwnResourceCard item={item} onOpenResource={openResource} />,
    [openResource],
  );

  const renderListItem = useCallback(
    (args: any) => {
      if (activeTab === "mis-solicitudes") return renderRequestCard(args);
      if (activeTab === "mis-postulaciones") return renderSentCard(args);
      return renderResourcesCard(args);
    },
    [activeTab, renderRequestCard, renderSentCard, renderResourcesCard],
  );

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
            const count = sentCounts[tab.key];
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
            onPress={openUploadResource}
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
          keyExtractor={keyExtractor}
          renderItem={renderListItem}
          contentContainerStyle={listContentStyle}
          refreshControl={refreshControl}
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
                  onPress={openNewRequest}
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

  primaryAction: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "center",
  },
  primaryActionText: { fontSize: 14, fontWeight: "700" },
});