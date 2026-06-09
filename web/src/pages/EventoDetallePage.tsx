import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import eventsService from "@/lib/services/events.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useEventCategories } from "@/hooks/useEventCategories";

export function EventoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const categories = useEventCategories();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    eventsService
      .getEventById(id)
      .then(({ event, isRegistered: registered }) => {
        setEvent(event);
        setIsRegistered(registered);
      })
      .catch((err) => setError(err?.message || "Error al cargar el evento"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!id || registering) return;
    setRegistering(true);
    setRegisterMsg(null);
    try {
      await eventsService.registerForEvent(id);
      setIsRegistered(true);
      setRegisterMsg("¡Inscripción exitosa!");
      const { event: updated } = await eventsService.getEventById(id);
      setEvent(updated);
    } catch (err: any) {
      setRegisterMsg(err?.message || "Error al inscribirse");
    } finally {
      setRegistering(false);
    }
  };

  const isPublished = event?.status === "published";
  const isFull =
    isPublished &&
    event?.maxCapacity !== null &&
    event?.registeredCount >= event?.maxCapacity;
  const isCancelled = event?.status === "cancelled";

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">{error || "Evento no encontrado"}</p>
          <Button onClick={() => navigate("/eventos")}>Volver a eventos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/eventos")}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Volver a eventos
        </button>

        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-64 object-cover rounded-xl mb-6"
          />
        )}

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold text-neutral-900">{event.title}</h1>
            <Badge>
              {categories.find((c) => c.slug === event.category)?.name
                ?? event.category
                ?? "Otro"}
            </Badge>
          </div>

          <p className="text-neutral-600 mb-6 leading-relaxed">
            {event.description || "Sin descripción"}
          </p>

          <div className="space-y-3 text-sm text-neutral-600 border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span>
                {new Date(event.eventDate).toLocaleDateString("es-CO", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              <span>
                {new Date(event.eventDate).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span>{event.location}</span>
              </div>
            )}
            {event.creator?.fullName && (
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <span>Organizado por {event.creator.fullName}</span>
              </div>
            )}
            {event.maxCapacity !== null && (
              <div className="flex items-center gap-2">
                <span className="text-lg">🎟️</span>
                <span>
                  Cupo: {event.registeredCount ?? 0} / {event.maxCapacity}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-4">
            {isRegistered ? (
              <button
                disabled
                className="w-full px-4 py-3 bg-neutral-300 text-neutral-600 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                Ya estás inscrito en este evento
              </button>
            ) : isCancelled ? (
              <button
                disabled
                className="w-full px-4 py-3 bg-neutral-300 text-neutral-600 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                Evento Cancelado - No acepta registros
              </button>
            ) : isFull ? (
              <button
                disabled
                className="w-full px-4 py-3 bg-neutral-300 text-neutral-600 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                Cupo Agotado
              </button>
            ) : isPublished ? (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {registering ? "Inscribiendo..." : "Inscribirme al evento"}
              </button>
            ) : null}
            {registerMsg && (
              <p className={`mt-2 text-sm text-center ${registerMsg.includes("exitosa") ? "text-green-600" : "text-error-600"}`}>
                {registerMsg}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventoDetallePage;
