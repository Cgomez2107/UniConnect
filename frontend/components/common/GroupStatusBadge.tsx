/**
 * components/common/GroupStatusBadge.tsx
 * Componente Badge que visualiza los 5 estados del ciclo de vida del grupo
 * basado en el patrón State implementado en el backend.
 */

import { Colors } from "@/constants/Colors";
import { StyleSheet, Text, View } from "react-native";

type GroupStatus = "abierta" | "llena" | "transferenciaPendiente" | "cerrada" | "expirada";

interface GroupStatusBadgeProps {
  status: GroupStatus;
  colors: typeof Colors.light;
  size?: "small" | "medium" | "large";
}

const STATUS_CONFIG: Record<
  GroupStatus,
  { label: string; bgColor: string; textColor: string; icon: string }
> = {
  abierta: {
    label: "Abierta",
    bgColor: "#E8F5E9",
    textColor: "#2E7D32",
    icon: "🟢",
  },
  llena: {
    label: "Llena",
    bgColor: "#FFF3E0",
    textColor: "#F57C00",
    icon: "🟠",
  },
  transferenciaPendiente: {
    label: "Transferencia",
    bgColor: "#E3F2FD",
    textColor: "#1976D2",
    icon: "⏳",
  },
  cerrada: {
    label: "Cerrada",
    bgColor: "#F3E5F5",
    textColor: "#7B1FA2",
    icon: "🔒",
  },
  expirada: {
    label: "Expirada",
    bgColor: "#FFEBEE",
    textColor: "#C62828",
    icon: "❌",
  },
};

export function GroupStatusBadge({
  status,
  colors,
  size = "medium",
}: GroupStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const styles = StyleSheet.create({
    badge: {
      paddingHorizontal: size === "small" ? 8 : size === "large" ? 16 : 12,
      paddingVertical: size === "small" ? 4 : size === "large" ? 8 : 6,
      borderRadius: size === "small" ? 4 : size === "large" ? 12 : 8,
      backgroundColor: config.bgColor,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    text: {
      fontSize: size === "small" ? 12 : size === "large" ? 16 : 14,
      fontWeight: "600",
      color: config.textColor,
    },
  });

  return (
    <View style={styles.badge}>
      <Text>{config.icon}</Text>
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
}

/**
 * Determina si una acción está disponible según el estado del grupo.
 * Útil para bloquear botones en UI.
 */
export function isActionAvailable(
  status: GroupStatus,
  action: "join" | "edit" | "requestAdminTransfer" | "acceptTransfer" | "rejectTransfer" | "close",
): boolean {
  const availableActions: Record<GroupStatus, string[]> = {
    abierta: ["join", "edit", "requestAdminTransfer", "close"],
    llena: ["edit", "requestAdminTransfer", "close"],
    transferenciaPendiente: ["acceptTransfer", "rejectTransfer", "close"],
    cerrada: [],
    expirada: [],
  };

  return availableActions[status]?.includes(action) ?? false;
}

/**
 * Mensaje descriptivo para cada estado
 */
export function getStatusDescription(status: GroupStatus): string {
  const descriptions: Record<GroupStatus, string> = {
    abierta: "Grupo disponible para unirse",
    llena: "Grupo alcanzó capacidad máxima",
    transferenciaPendiente: "Administrador espera confirmación de transferencia",
    cerrada: "Grupo fue cerrado manualmente",
    expirada: "Grupo expiró por límite de tiempo",
  };

  return descriptions[status];
}
