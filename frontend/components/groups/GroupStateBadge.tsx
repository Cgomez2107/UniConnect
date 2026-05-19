import { View, Text, StyleSheet } from "react-native";

interface StateVisualConfig {
  label: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
}

const STATE_CONFIG: Record<string, StateVisualConfig> = {
  Activo: {
    label: "Activo",
    icon: "✅",
    backgroundColor: "#E8F5E9",
    textColor: "#2E7D32",
  },
  PendienteTransferencia: {
    label: "Transferencia Pendiente",
    icon: "⏳",
    backgroundColor: "#FFF8E1",
    textColor: "#F57F17",
  },
  TransferenciaAceptada: {
    label: "Transferencia Aceptada",
    icon: "🔄",
    backgroundColor: "#E3F2FD",
    textColor: "#1565C0",
  },
  Disuelto: {
    label: "Disuelto",
    icon: "🚫",
    backgroundColor: "#FFEBEE",
    textColor: "#C62828",
  },
  Bloqueado: {
    label: "Bloqueado",
    icon: "🔒",
    backgroundColor: "#F5F5F5",
    textColor: "#616161",
  },
};

const FALLBACK_CONFIG: StateVisualConfig = {
  label: "Estado desconocido",
  icon: "❓",
  backgroundColor: "#FAFAFA",
  textColor: "#9E9E9E",
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  containerSmall: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  containerMedium: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  containerLarge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  textSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  textMedium: {
    fontSize: 14,
    lineHeight: 20,
  },
  textLarge: {
    fontSize: 16,
    lineHeight: 22,
  },
  label: {
    fontWeight: "600",
  },
});

const SIZE_MAP = {
  small: { container: styles.containerSmall, text: styles.textSmall },
  medium: { container: styles.containerMedium, text: styles.textMedium },
  large: { container: styles.containerLarge, text: styles.textLarge },
};

interface GroupStateBadgeProps {
  state: string;
  size?: "small" | "medium" | "large";
}

export function GroupStateBadge({ state, size = "medium" }: GroupStateBadgeProps) {
  const config = STATE_CONFIG[state] ?? FALLBACK_CONFIG;
  const dims = SIZE_MAP[size];

  return (
    <View style={[styles.container, dims.container, { backgroundColor: config.backgroundColor }]}>
      <Text style={dims.text}>{config.icon}</Text>
      <Text style={[dims.text, styles.label, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  );
}
