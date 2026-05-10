import React from "react";
import { StudyRequestUI, RequestStatusUI } from "@/types/ui";
import { spacing, shadows } from "@uniconnect/shared-ui";

interface SolicitudCardProps {
  solicitud: StudyRequestUI;
  onViewDetails: (id: string) => void;
  onApply?: (id: string) => void;
  applicationStatus?: "pendiente" | "aceptada" | "rechazada" | null;
}

const applicationStatusConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: "En revisión", className: "bg-yellow-100 text-yellow-800" },
  aceptada: { label: "Aceptada", className: "bg-green-100 text-green-800" },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-800" },
};

export function SolicitudCard({
  solicitud,
  onViewDetails,
  onApply,
  applicationStatus,
}: SolicitudCardProps) {
  const statusLabels: Record<RequestStatusUI, string> = {
    abierta: "Abierto",
    cerrada: "Cerrada",
    expirada: "Expirada",
  };

  const statusColors: Record<RequestStatusUI, string> = {
    abierta: "bg-success-100 text-success-800",
    cerrada: "bg-neutral-100 text-neutral-800",
    expirada: "bg-warning-100 text-warning-800",
  };

  const authorName = solicitud.creatorName || solicitud.profiles?.fullName || "Usuario";
  const avatarUrl = solicitud.profiles?.avatarUrl;
  const authorInitials = authorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const appBadge = applicationStatus ? applicationStatusConfig[applicationStatus] : null;

  return (
    <article
      className="bg-neutral-50 border border-neutral-200 p-4"
      style={{ borderRadius: spacing.md, boxShadow: shadows.md }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={authorName}
              className="h-12 w-12 rounded-full object-cover border border-neutral-200"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center font-semibold text-white"
              style={{ backgroundColor: "#0d2852" }}
            >
              {authorInitials || "U"}
            </div>
          )}

          <div>
            <p className="font-semibold text-neutral-900 text-sm">
              {authorName}
            </p>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: "#d4a843" }}
            >
              {solicitud.subjectName || solicitud.subjects?.name || "Sin materia"}
            </span>
          </div>
        </div>

        <span className={`px-3 py-1 text-xs rounded-full ${statusColors[solicitud.status]}`}>
          {statusLabels[solicitud.status]}
        </span>
      </div>

      <h3 className="font-semibold text-xl text-neutral-900 mb-2">
        {solicitud.title || "Solicitud"}
      </h3>

      <p className="text-sm text-neutral-700 mb-4">
        {solicitud.description || "Sin descripción"}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold">
          {solicitud.memberCount || 0} / {solicitud.maxMembers || 0} miembros
        </span>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={() => onViewDetails(solicitud.id)}
          className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors"
        >
          Ver detalles
        </button>
        {appBadge ? (
          <span className={`px-3 py-2 rounded-md text-sm font-medium ${appBadge.className}`}>
            {appBadge.label}
          </span>
        ) : solicitud.status === "abierta" && onApply ? (
          <button
            onClick={() => onApply(solicitud.id)}
            className="flex-1 px-3 py-2 border border-primary-600 text-primary-700 rounded-md text-sm hover:bg-primary-600 hover:text-white transition-colors"
          >
            Postularme
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default SolicitudCard;
