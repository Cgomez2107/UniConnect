import React from "react";
import { StudyRequest } from "@/types";

interface SolicitudListProps {
  solicitudes: StudyRequest[];
  loading?: boolean;
  onSelectSolicitud: (solicitud: StudyRequest) => void;
}

/**
 * SolicitudList component - renders list of study group requests
 */
export function SolicitudList({
  solicitudes,
  loading = false,
  onSelectSolicitud,
}: SolicitudListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-200 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No hay solicitudes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {solicitudes.map((solicitud) => (
        <button
          key={solicitud.id}
          onClick={() => onSelectSolicitud(solicitud)}
          className="w-full text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-l-uc-blue"
        >
          <h3 className="font-semibold text-gray-900">
            {solicitud.subject?.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {solicitud.description}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {solicitud.memberCount} miembros
          </p>
        </button>
      ))}
    </div>
  );
}

export default SolicitudList;
