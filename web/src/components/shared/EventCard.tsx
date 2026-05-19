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
    <div className="card-hover overflow-hidden">
      {event.imageUrl && (
        <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover" />
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-base text-neutral-900 flex-1">
            {event.title}
          </h3>
          <Badge>{categoryLabels[event.category]}</Badge>
        </div>

        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{event.description}</p>

        <div className="space-y-1.5 mb-4 text-sm text-neutral-600">
          <p className="flex items-center gap-1.5">
            <span className="text-base">📅</span>
            {new Date(event.eventDate).toLocaleDateString("es-CO")}
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-base">⏰</span>
            {new Date(event.eventDate).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-base">📍</span>
            {event.location}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(event.id)}
            className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Ver detalles
          </button>
          {onAttend && (
            <button
              onClick={() => onAttend(event.id)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isAttending
                  ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  : "border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white"
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
