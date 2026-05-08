import React from "react";
import { CampusEventUI, EventCategoryUI } from "@/types/ui";
import { Badge } from "@/components/ui/Badge";

interface EventCardProps {
  event: CampusEventUI;
  onViewDetails: (id: string) => void;
  onAttend?: (id: string) => void;
  isAttending?: boolean;
}

/**
 * EventCard component for displaying campus events
 */
export function EventCard({
  event,
  onViewDetails,
  onAttend,
  isAttending = false,
}: EventCardProps) {
  const categoryLabels: Record<EventCategoryUI, string> = {
    academico: "Académico",
    cultural: "Cultural",
    deportivo: "Deporte",
    otro: "Otro",
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {event.imageUrl && (
        <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover" />
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900 flex-1">
            {event.title}
          </h3>
          <Badge>{categoryLabels[event.category]}</Badge>
        </div>

        <p className="text-sm text-gray-600 mb-3">{event.description}</p>

        <div className="space-y-2 mb-4 text-sm text-gray-700">
          <p>📅 {new Date(event.eventDate).toLocaleDateString("es-CO")}</p>
          <p>
            ⏰ {new Date(event.eventDate).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p>📍 {event.location}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(event.id)}
            className="flex-1 px-3 py-2 bg-uc-blue text-white rounded text-sm hover:bg-uc-blue-dark transition-colors"
          >
            Ver detalles
          </button>
          {onAttend && (
            <button
              onClick={() => onAttend(event.id)}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                isAttending
                  ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  : "border-2 border-uc-blue text-uc-blue hover:bg-uc-blue hover:text-white"
              }`}
            >
              {isAttending ? "Asistiendo" : "Asistir"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventCard;
