import React from "react";
import { StudyRequestUI } from "@/types/ui";

interface SolicitudListProps {
  solicitudes: StudyRequestUI[];
  loading?: boolean;
  onSelectSolicitud: (solicitud: StudyRequestUI) => void;
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
            className="h-20 bg-neutral-200 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">No hay solicitudes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {solicitudes.map((solicitud) => (
        <button
          key={solicitud.id}
          onClick={() => onSelectSolicitud(solicitud)}
          className="w-full text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-l-primary-500"
        >
          <h3 className="font-semibold text-neutral-900">{solicitud.subjectName}</h3>
          <p className="text-sm text-neutral-600 mt-1">
            {solicitud.description}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            {solicitud.memberCount} miembros
          </p>
        </button>
      ))}
    </div>
  );
}

export default SolicitudList;
