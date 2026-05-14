import React from "react";
import { StudyRequestUI, RequestStatusUI } from "@/types/ui";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/RoleBadge";

interface SolicitudCardProps {
  solicitud: StudyRequestUI;
  onViewDetails: (id: string) => void;
  onApply?: (id: string) => void;
  applicationStatus?: "pendiente" | "aceptada" | "rechazada" | null;
  isAuthor?: boolean;
}

const applicationStatusConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: "En revisión", className: "badge-warning" },
  aceptada: { label: "Aceptada", className: "badge-success" },
  rechazada: { label: "Rechazada", className: "badge-danger" },
};

export function SolicitudCard({
  solicitud,
  onViewDetails,
  onApply,
  applicationStatus,
  isAuthor,
}: SolicitudCardProps) {
  const statusLabels: Record<RequestStatusUI, string> = {
    abierta: "Abierto",
    cerrada: "Cerrada",
    expirada: "Expirada",
  };

  const statusColors: Record<RequestStatusUI, string> = {
    abierta: "badge-success",
    cerrada: "badge-neutral",
    expirada: "badge-warning",
  };

  const authorName = solicitud.creatorName || solicitud.profiles?.fullName || "Usuario";

  const appBadge = applicationStatus ? applicationStatusConfig[applicationStatus] : null;

  return (
    <article className="card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={solicitud.profiles?.avatarUrl ?? undefined}
            name={authorName}
            size="md"
          />

          <div>
            <p className="font-semibold text-neutral-900 text-sm">
              {authorName}
            </p>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-500/10 text-secondary-700">
              {solicitud.subjectName || solicitud.subjects?.name || "Sin materia"}
            </span>
          </div>
        </div>

        <span className={`${statusColors[solicitud.status]}`}>
          {statusLabels[solicitud.status]}
        </span>
      </div>

      <h3 className="font-semibold text-lg text-neutral-900 mb-1">
        {solicitud.title || "Solicitud"}
      </h3>

      <p className="text-xs text-neutral-500 mb-2">
        Creado por <span className="font-medium text-neutral-700">{authorName}</span>
      </p>

      <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
        {solicitud.description || "Sin descripción"}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="badge-neutral">
          {solicitud.memberCount || 0} / {solicitud.maxMembers || 0} miembros
        </span>
      </div>

      <div className="flex gap-2 items-center">
        <button
          onClick={() => onViewDetails(solicitud.id)}
          className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors font-medium"
        >
          Ver detalles
        </button>
        {isAuthor ? (
          <RoleBadge role="autor" />
        ) : appBadge ? (
          <span className={`px-3 py-2 rounded-md text-sm font-medium ${appBadge.className}`}>
            {appBadge.label}
          </span>
        ) : solicitud.status === "abierta" && onApply ? (
          <button
            onClick={() => onApply(solicitud.id)}
            className="flex-1 px-3 py-2 border-2 border-primary-600 text-primary-700 rounded-md text-sm hover:bg-primary-600 hover:text-white transition-colors font-medium"
          >
            Postularme
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default SolicitudCard;
