import React from "react";
import "./GroupStatusBadge.css";

type GroupStatus = "abierta" | "llena" | "transferenciaPendiente" | "cerrada" | "expirada";

interface GroupStatusBadgeProps {
  status: GroupStatus;
  size?: "small" | "medium" | "large";
}

const STATUS_CONFIG: Record<
  GroupStatus,
  { label: string; icon: string; className: string }
> = {
  abierta: {
    label: "Abierta",
    icon: "🟢",
    className: "status-abierta",
  },
  llena: {
    label: "Llena",
    icon: "🟠",
    className: "status-llena",
  },
  transferenciaPendiente: {
    label: "Transferencia",
    icon: "⏳",
    className: "status-transferencia",
  },
  cerrada: {
    label: "Cerrada",
    icon: "🔒",
    className: "status-cerrada",
  },
  expirada: {
    label: "Expirada",
    icon: "❌",
    className: "status-expirada",
  },
};

export function GroupStatusBadge({
  status,
  size = "medium",
}: GroupStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`status-badge ${config.className} size-${size}`}>
      <span className="badge-icon">{config.icon}</span>
      <span className="badge-text">{config.label}</span>
    </div>
  );
}

export function isActionAvailable(
  status: GroupStatus,
  action: "join" | "edit" | "requestAdminTransfer" | "acceptTransfer" | "rejectTransfer" | "close"
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
