import React from "react";
import { StudyRequestUI, RequestStatusUI } from "@/types/ui";

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
    abierta: "bg-green-100 text-green-800",
    cerrada: "bg-gray-100 text-gray-800",
    expirada: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-gray-900">
          {solicitud.subjectName || solicitud.subjects?.name || "Solicitud"}
        </h3>
        <span className={`px-2 py-1 text-xs rounded ${statusColors[solicitud.status]}`}>
          {statusLabels[solicitud.status]}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        {solicitud.description || "Sin descripción"}
      </p>

      <div className="flex gap-2 mb-3 text-sm text-gray-700">
        <span>👤 {solicitud.creatorName || "Usuario"}</span>
        <span>👥 {solicitud.memberCount || 0} miembros</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(solicitud.id)}
          className="flex-1 px-3 py-2 bg-uc-blue text-white rounded text-sm hover:bg-uc-blue-dark transition-colors"
        >
          Ver detalles
        </button>
        {solicitud.status === "abierta" && onApply && (
          <button
            onClick={() => onApply(solicitud.id)}
            className="flex-1 px-3 py-2 border-2 border-uc-blue text-uc-blue rounded text-sm hover:bg-uc-blue hover:text-white transition-colors"
          >
            Postularse
          </button>
        )}
      </div>
    </div>
  );
}

export default SolicitudCard;
