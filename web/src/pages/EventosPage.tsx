import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useEvents from "@/hooks/useEvents";
import { useEventsSync } from "@/hooks";
import { useEventSubscriptionStore } from "@/store/useEventSubscriptionStore";
import { EventCard } from "@/components/shared/EventCard";
import { Button } from "@/components/ui/Button";

const CATEGORIES = [
  { value: "academico", label: "Académico", icon: "🎓" },
  { value: "cultural", label: "Cultural", icon: "🎭" },
  { value: "deportivo", label: "Deportivo", icon: "⚽" },
  { value: "otro", label: "Otro", icon: "📌" },
] as const;

export function EventosPage() {
  const navigate = useNavigate();
  const { events = [], isLoading = false, error = null, loadEvents } = useEvents() as any;
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const subscribedCategories = useEventSubscriptionStore((s) => s.subscribedCategories);
  const toggleSubscription = useEventSubscriptionStore((s) => s.toggle);
  const isSubscribed = (category: string) => subscribedCategories.includes(category);

  // Sincronización en tiempo real — actualiza el store cuando otro usuario crea/edita/elimina un evento
  useEventsSync();

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    let result = events || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (event: any) =>
          (event.title?.toLowerCase() || "").includes(term) ||
          (event.description?.toLowerCase() || "").includes(term),
      );
    }

    if (activeCategory) {
      result = result.filter((event: any) => event.category === activeCategory);
    }

    return result;
  }, [events, searchTerm, activeCategory]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const event of filteredEvents) {
      const cat = event.category || "otro";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(event);
    }
    return groups;
  }, [filteredEvents]);

  const handleViewDetails = (id: string) => {
    navigate(`/eventos/${id}`);
  };

  const hasActiveFilter = activeCategory !== null || searchTerm !== "";

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">
              Eventos del Campus
            </h1>
            <p className="text-neutral-500 text-sm">
              Descubre eventos académicos, culturales y deportivos
            </p>
          </div>
          <Button onClick={() => navigate("/crear-evento")}>
            + Nuevo Evento
          </Button>
        </div>

        <div className="mb-6 space-y-3">
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
          />

          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Todas
            </button>
            {CATEGORIES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() =>
                  setActiveCategory(activeCategory === value ? null : value)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === value
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span className="mr-1.5">{icon}</span>
                {label}
              </button>
            ))}
            {hasActiveFilter && (
              <button
                onClick={() => { setActiveCategory(null); setSearchTerm(""); }}
                className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium ml-1"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 skeleton rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700 text-sm mb-6">
            {error}
          </div>
        )}

        {!isLoading && filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500 mb-4">
              {hasActiveFilter
                ? "No hay eventos que coincidan con tu búsqueda"
                : "No hay eventos disponibles"}
            </p>
            <Button onClick={() => navigate("/crear-evento")}>
              Crear el primer evento
            </Button>
          </div>
        )}

        {!isLoading && filteredEvents.length > 0 && (
          <div className="space-y-10">
            {CATEGORIES.map(({ value, label, icon }) => {
              const catEvents = groupedByCategory[value];
              if (!catEvents?.length) return null;
              const subscribed = isSubscribed(value);

              return (
                <section key={value}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="inline-flex items-center gap-2 text-lg font-bold text-neutral-800">
                      <span>{icon}</span>
                      <span>{label}</span>
                      <span className="text-sm font-normal text-neutral-400 ml-1">
                        ({catEvents.length})
                      </span>
                    </h2>
                    <button
                      onClick={() => toggleSubscription(value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        subscribed
                          ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {subscribed ? "Suscrito" : "Suscribirse"}
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catEvents.map((event: any) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventosPage;
