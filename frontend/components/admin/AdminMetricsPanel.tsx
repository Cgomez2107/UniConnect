import { EmptyState } from "@/components/shared/EmptyState";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface AdminMetrics {
  totalUsers: number;
  activeStudents: number;
  openRequests: number;
  totalResources: number;
  totalMessages: number;
}

interface Props {
  metrics: AdminMetrics | null;
  C: (typeof Colors)["light"];
}

const METRIC_ITEMS: { key: keyof AdminMetrics; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "totalUsers", label: "Usuarios totales", icon: "people-outline" },
  { key: "activeStudents", label: "Estudiantes activos", icon: "school-outline" },
  { key: "openRequests", label: "Solicitudes abiertas", icon: "document-text-outline" },
  { key: "totalResources", label: "Recursos subidos", icon: "folder-open-outline" },
  { key: "totalMessages", label: "Mensajes enviados", icon: "chatbubble-ellipses-outline" },
];

export function AdminMetricsPanel({ metrics, C }: Props) {
  if (!metrics) {
    return <EmptyState emoji="📊" iconName="stats-chart-outline" title="Sin datos" body="No se pudieron cargar las métricas." />;
  }

  return (
    <>
      {METRIC_ITEMS.map((metric) => (
        <View key={metric.key} style={[styles.metricCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={[styles.metricIconWrap, { backgroundColor: C.primary + "14" }]}>
            <Ionicons name={metric.icon} size={24} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.metricValue, { color: C.textPrimary }]}>{metrics[metric.key]}</Text>
            <Text style={[styles.metricLabel, { color: C.textSecondary }]}>{metric.label}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  metricIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: { fontSize: 32, fontWeight: "800" },
  metricLabel: { fontSize: 13, marginTop: 2 },
});
