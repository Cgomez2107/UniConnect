import React from "react";
import { StudyRequestUI, RequestStatusUI } from "@/types/ui";
import { spacing, shadows } from "@uniconnect/shared-ui";

interface SolicitudCardProps {
  solicitud: StudyRequestUI;
  onViewDetails: (id: string) => void;
  onApply?: (id: string) => void;
}

/**
 * SolicitudCard component for displaying study group requests/solicitudes
 */
export function SolicitudCard({
  solicitud,
  onViewDetails,
  onApply,
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
            <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
              {authorInitials || "U"}
            </div>
          )}

          <div>
            <p className="font-semibold text-neutral-900 uppercase tracking-wide text-sm">
              {authorName}
            </p>
            <p className="text-sm text-neutral-700">
              {solicitud.subjectName || solicitud.subjects?.name || "Sin materia"}
            </p>
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
          {solicitud.memberCount || 0}/{solicitud.maxMembers || 0}
        </span>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={() => onViewDetails(solicitud.id)}
          className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors"
        >
          Ver detalles
        </button>
        {solicitud.status === "abierta" && onApply && (
          <button
            onClick={() => onApply(solicitud.id)}
            className="flex-1 px-3 py-2 border border-primary-600 text-primary-700 rounded-md text-sm hover:bg-primary-600 hover:text-white transition-colors"
          >
            Postularme
          </button>
        )}
      </div>
    </article>
  );
}

export default SolicitudCard;
