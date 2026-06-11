import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import eventsService from "@/lib/services/events.service";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useEventCategories } from "@/hooks/useEventCategories";
import { useAuthStore } from "@/store/useAuthStore";
import useNotifications from "@/hooks/useNotifications";

export function EventoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const categories = useEventCategories();
  const user = useAuthStore((s) => s.user);
  const { success, error: showError } = useNotifications();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [unregistering, setUnregistering] = useState(false);

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
      const isConcurrencyFull = err?.status === 409 || err?.response?.status === 409 || err?.message?.includes("Cupo agotado") || err?.message?.includes("Ya estás inscrito");
      if (isConcurrencyFull) {
        setRegisterMsg("Lo sentimos, el cupo para este evento se agotó justo antes de completar tu registro.");
        try {
          const { event: updated } = await eventsService.getEventById(id);
          setEvent(updated);
        } catch (silentErr) {
          console.error("Error doing silent refresh:", silentErr);
        }
      } else {
        setRegisterMsg(err?.message || "Error al inscribirse");
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!id || unregistering) return;
    setUnregistering(true);
    setRegisterMsg(null);
    try {
      await eventsService.unregisterForEvent(id);
      setIsRegistered(false);
      success("Has cancelado tu inscripción exitosamente. Tu cupo ha sido liberado.");
      const { event: updated } = await eventsService.getEventById(id);
      setEvent(updated);
    } catch (err: any) {
      const isPolicyViolation = err?.status === 400 || err?.response?.status === 400 || err?.message?.includes("Política de cancelación");
      if (isPolicyViolation) {
        showError("Política de cancelación: No se permiten cancelaciones a menos de 24 horas del evento. Contacta al organizador directamente.");
      } else {
        showError(err?.message || "Error al cancelar la inscripción");
      }
    } finally {
      setUnregistering(false);
    }
  };

  const handlePublish = useCallback(async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      const updated = await eventsService.publishEvent(id);
      setEvent((prev: any) => ({ ...prev, ...updated }));
      success("Evento publicado exitosamente");
    } catch (err: any) {
      showError(err?.message || "Error al publicar el evento");
    } finally {
      setActionLoading(false);
    }
  }, [id, actionLoading, success, showError]);

  const handleCancel = useCallback(async () => {
    if (!id || actionLoading) return;
    setActionLoading(true);
    try {
      const updated = await eventsService.cancelEvent(id);
      setEvent((prev: any) => ({ ...prev, ...updated }));
      success("Evento cancelado exitosamente");
    } catch (err: any) {
      showError(err?.message || "Error al cancelar el evento");
    } finally {
      setActionLoading(false);
    }
  }, [id, actionLoading, success, showError]);

  const isOwner = user?.id && user.id === event?.createdBy;
  const isPublished = event?.status === "published";
  const isDraft = event?.status === "draft";
  const isCancelled = event?.status === "cancelled";
  const isFinished = event?.status === "finished";
  const isFull =
    isPublished &&
    event?.maxCapacity !== null &&
    event?.registeredCount >= event?.maxCapacity;

  const statusColors: Record<string, string> = {
    draft: "bg-amber-100 text-amber-800",
    published: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    finished: "bg-neutral-200 text-neutral-600",
  };

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
            <div className="flex gap-1.5">
              {event.status && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[event.status] || "bg-neutral-100 text-neutral-600"}`}>
                  {isDraft ? "Borrador" : isPublished ? "Publicado" : isCancelled ? "Cancelado" : isFinished ? "Finalizado" : event.status}
                </span>
              )}
              <Badge>
                {categories.find((c) => c.slug === event.category)?.name
                  ?? event.category
                  ?? "Otro"}
              </Badge>
            </div>
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
            <div className="flex items-center gap-2">
              <span className="text-lg">🎟️</span>
              <span>
                Cupos disponibles: {event.maxCapacity !== null ? `${Math.max(0, event.maxCapacity - (event.registeredCount ?? 0))} / ${event.maxCapacity}` : "Ilimitados"}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-4">
            {isOwner ? (
              <div className="flex flex-col gap-3">
                {isDraft && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/crear-evento?edit=${event.id}`)}
                      variant="secondary"
                      className="flex-1"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={handlePublish}
                      loading={actionLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Publicar
                    </Button>
                  </div>
                )}
                {isPublished && (
                  <Button
                    onClick={handleCancel}
                    loading={actionLoading}
                    variant="secondary"
                    className="w-full bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                  >
                    Cancelar Evento
                  </Button>
                )}
                {isCancelled && (
                  <p className="text-sm text-neutral-500 text-center">
                    Este evento fue cancelado
                  </p>
                )}
                {isFinished && (
                  <p className="text-sm text-neutral-500 text-center">
                    Este evento ha finalizado
                  </p>
                )}
              </div>
            ) : (
              <>
                {isRegistered && isPublished ? (
                  <button
                    onClick={handleUnregister}
                    disabled={unregistering}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {unregistering ? "Cancelando..." : "Cancelar inscripción"}
                  </button>
                ) : isRegistered ? (
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
              </>
            )}
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
