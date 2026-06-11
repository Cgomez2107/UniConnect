import React from "react";
import { CampusEventUI } from "@/types/ui";
import { Badge } from "@/components/ui/Badge";
import { useEventCategories } from "@/hooks/useEventCategories";

interface EventCardProps {
  event: CampusEventUI;
  onViewDetails: (id: string) => void;
  onAttend?: (id: string) => void;
  isAttending?: boolean;
  onPublish?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  highlight?: string;
}

function highlightText(text: string | null | undefined, term?: string): React.ReactNode {
  if (!text) return text;
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
      : part,
  );
}

export function EventCard({
  event,
  onViewDetails,
  onAttend,
  isAttending = false,
  onPublish,
  onEdit,
  onCancel,
  highlight,
}: EventCardProps) {
  const categories = useEventCategories();

  const categoryName =
    categories.find((c) => c.slug === event.category)?.name
    ?? event.category
    ?? "Otro";

  const statusColors: Record<string, string> = {
    draft: "bg-amber-100 text-amber-800",
    published: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    finished: "bg-neutral-200 text-neutral-600",
  };

  const isDisabled = event.isFull || event.status === "cancelled";

  return (
    <div className="card-hover overflow-hidden">
      {event.imageUrl && (
        <img src={event.imageUrl} alt={event.title} className="w-full h-40 object-cover" />
      )}

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-base text-neutral-900 flex-1">
            {highlightText(event.title, highlight)}
          </h3>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {event.isFull && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                Cupo agotado
              </span>
            )}
            {event.status && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[event.status] || "bg-neutral-100 text-neutral-600"}`}>
                {event.status === "draft" ? "Borrador" : event.status === "published" ? "Publicado" : event.status === "cancelled" ? "Cancelado" : event.status === "finished" ? "Finalizado" : event.status}
              </span>
            )}
            <Badge>{categoryName}</Badge>
          </div>
        </div>

        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{highlightText(event.description, highlight)}</p>

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
          {event.status === "draft" && onEdit && (
            <button
              onClick={() => onEdit(event.id)}
              className="flex-1 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              Editar
            </button>
          )}
          {event.status === "draft" && onPublish && (
            <button
              onClick={() => onPublish(event.id)}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Publicar
            </button>
          )}
          {event.status === "published" && onAttend && (
            <button
              onClick={() => onAttend(event.id)}
              disabled={isDisabled}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isDisabled
                  ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                  : isAttending
                    ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    : "border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white"
              }`}
            >
              {isDisabled ? "No disponible" : isAttending ? "Asistiendo" : "Asistir"}
            </button>
          )}
          {event.status === "published" && !isDisabled && onCancel && (
            <button
              onClick={() => onCancel(event.id)}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={() => onViewDetails(event.id)}
            className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventCard;