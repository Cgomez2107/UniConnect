/**
 * app/(tabs)/invitaciones.tsx
 * Bandeja de postulaciones recibidas — US-010
 *
 * El autor de una solicitud puede:
 *   - Ver quién se postuló a sus grupos
 *   - Leer el mensaje de presentación
 *   - Aceptar o Rechazar cada postulación pendiente
 *
 * Tabs internos: Pendientes / Aceptadas / Rechazadas
 */

import { Colors } from "@/constants/Colors";
import { getReceivedApplications, reviewApplication } from "@/lib/services/careerService";
import { useAuthStore } from "@/store/useAuthStore";
import type { Application } from "@/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

type FilterTab = "pendiente" | "aceptada" | "rechazada";

const TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: "pendiente", label: "Pendientes", emoji: "🕐" },
  { key: "aceptada",  label: "Aceptadas",  emoji: "✅" },
  { key: "rechazada", label: "Rechazadas", emoji: "❌" },
];

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0] ?? "").join("").toUpperCase();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

// ── Tarjeta de postulación ────────────────────────────────────────────────────

interface CardProps {
  app: Application;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  loading: boolean;
  C: (typeof Colors)["light"];
}

function ApplicationCard({ app, onAccept, onReject, loading, C }: CardProps) {
  const applicantName = app.profiles?.full_name ?? "Estudiante";
  const requestTitle  = (app as any).study_requests?.title ?? "Solicitud";
  const subjectName   = (app as any).study_requests?.subjects?.name ?? "";

  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      {/* Cabecera */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: C.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: C.primary }]}>{getInitials(applicantName)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.applicantName, { color: C.textPrimary }]} numberOfLines={1}>
            {applicantName}
          </Text>
          <Text style={[styles.requestTitle, { color: C.textSecondary }]} numberOfLines={1}>
            {requestTitle}{subjectName ? ` · ${subjectName}` : ""}
          </Text>
        </View>
        <Text style={[styles.timeAgo, { color: C.textPlaceholder }]}>{timeAgo(app.created_at)}</Text>
      </View>

      {/* Mensaje */}
      <Text style={[styles.message, { color: C.textSecondary }]} numberOfLines={3}>
        "{app.message}"
      </Text>

      {/* Botones si pendiente */}
      {app.status === "pendiente" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnReject, { borderColor: C.error }]}
            onPress={() => onReject(app.id)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: C.error }]}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnAccept, { backgroundColor: loading ? C.border : C.primary }]}
            onPress={() => onAccept(app.id)}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={[styles.btnText, { color: C.textOnPrimary }]}>Aceptar</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Badge estado */}
      {app.status !== "pendiente" && (
        <View style={[
          styles.badge,
          { backgroundColor: app.status === "aceptada" ? C.success + "20" : C.error + "15" },
        ]}>
          <Text style={[styles.badgeText, { color: app.status === "aceptada" ? C.success : C.error }]}>
            {app.status === "aceptada" ? "✅ Aceptada" : "❌ Rechazada"}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────

export default function InvitacionesScreen() {
  const scheme = useColorScheme() ?? "light";
  const C      = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user   = useAuthStore((s) => s.user);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [actionId, setActionId]         = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<FilterTab>("pendiente");

  const load = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await getReceivedApplications(user.id);
      setApplications(data);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "No se pudieron cargar las postulaciones.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAccept = (appId: string) => {
    Alert.alert("Aceptar postulación", "¿Confirmas que quieres aceptar a este estudiante?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aceptar",
        onPress: async () => {
          setActionId(appId);
          try {
            await reviewApplication(appId, "aceptada");
            setApplications((prev) =>
              prev.map((a) => a.id === appId ? { ...a, status: "aceptada" } : a)
            );
          } catch (e: any) {
            Alert.alert("Error", e.message);
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const handleReject = (appId: string) => {
    Alert.alert("Rechazar postulación", "¿Confirmas que quieres rechazar esta postulación?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rechazar",
        style: "destructive",
        onPress: async () => {
          setActionId(appId);
          try {
            await reviewApplication(appId, "rechazada");
            setApplications((prev) =>
              prev.map((a) => a.id === appId ? { ...a, status: "rechazada" } : a)
            );
          } catch (e: any) {
            Alert.alert("Error", e.message);
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const filtered     = applications.filter((a) => a.status === activeTab);
  const pendingCount = applications.filter((a) => a.status === "pendiente").length;

  return (
    <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View>
          <Text style={[styles.title, { color: C.textPrimary }]}>Postulaciones</Text>
          <Text style={[styles.sub, { color: C.textSecondary }]}>
            {loading
              ? "Cargando..."
              : `${applications.length} recibidas${pendingCount > 0 ? ` · ${pendingCount} pendientes` : ""}`}
          </Text>
        </View>
      </View>

      {/* Tabs de filtro */}
      <View style={[styles.tabs, { borderBottomColor: C.border }]}>
        {TABS.map((tab) => {
          const count  = applications.filter((a) => a.status === tab.key).length;
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && { borderBottomColor: C.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: active ? C.primary : C.textSecondary }]}>
                {tab.emoji} {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: active ? C.primary : C.border }]}>
                  <Text style={[styles.tabBadgeText, { color: active ? "#fff" : C.textSecondary }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ApplicationCard
              app={item}
              onAccept={handleAccept}
              onReject={handleReject}
              loading={actionId === item.id}
              C={C}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 80 },
            filtered.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 44 }}>
                {activeTab === "pendiente" ? "🔔" : activeTab === "aceptada" ? "✅" : "❌"}
              </Text>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
                {activeTab === "pendiente"
                  ? "Sin postulaciones pendientes"
                  : activeTab === "aceptada"
                  ? "Ninguna aceptada aún"
                  : "Ninguna rechazada"}
              </Text>
              <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
                {activeTab === "pendiente"
                  ? "Cuando alguien se postule a tus grupos aparecerá aquí."
                  : "Las postulaciones que gestiones aparecerán aquí."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  sub:   { fontSize: 12, marginTop: 2 },

  tabs: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 4 },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 10, gap: 4,
  },
  tabText:      { fontSize: 12, fontWeight: "600" },
  tabBadge:     { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: "center" },
  tabBadgeText: { fontSize: 10, fontWeight: "700" },

  list:      { padding: 12, gap: 12 },
  listEmpty: { flex: 1 },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyBody:  { fontSize: 14, textAlign: "center", lineHeight: 20 },

  card:          { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader:    { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar:        { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText:    { fontSize: 16, fontWeight: "700" },
  applicantName: { fontSize: 14, fontWeight: "700" },
  requestTitle:  { fontSize: 12, marginTop: 1 },
  timeAgo:       { fontSize: 11 },
  message:       { fontSize: 13, lineHeight: 19, fontStyle: "italic" },

  actions:   { flexDirection: "row", gap: 8 },
  btn:       { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: "center" },
  btnReject: { borderWidth: 1, backgroundColor: "transparent" },
  btnAccept: {},
  btnText:   { fontSize: 14, fontWeight: "700" },

  badge:     { borderRadius: 8, paddingVertical: 6, alignItems: "center" },
  badgeText: { fontSize: 13, fontWeight: "600" },
});