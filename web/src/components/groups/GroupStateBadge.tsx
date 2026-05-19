import type { GroupState } from "../../types";
import "./GroupStateBadge.css";

interface StateVisualConfig {
  label: string;
  icon: string;
  className: string;
}

const STATE_CONFIG: Record<GroupState, StateVisualConfig> = {
  Activo: {
    label: "Activo",
    icon: "✅",
    className: "state-activo",
  },
  PendienteTransferencia: {
    label: "Transferencia Pendiente",
    icon: "⏳",
    className: "state-pendiente",
  },
  TransferenciaAceptada: {
    label: "Transferencia Aceptada",
    icon: "🔄",
    className: "state-aceptada",
  },
  Disuelto: {
    label: "Disuelto",
    icon: "🚫",
    className: "state-disuelto",
  },
  Bloqueado: {
    label: "Bloqueado",
    icon: "🔒",
    className: "state-bloqueado",
  },
};

const FALLBACK_CONFIG: StateVisualConfig = {
  label: "Estado desconocido",
  icon: "❓",
  className: "state-desconocido",
};

interface GroupStateBadgeProps {
  state: string;
  size?: "small" | "medium" | "large";
}

export function GroupStateBadge({ state, size = "medium" }: GroupStateBadgeProps) {
  const config = STATE_CONFIG[state] ?? FALLBACK_CONFIG;

  return (
    <div className={`state-badge ${config.className} size-${size}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-text">{config.label}</span>
    </div>
  );
}
