import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useEvents from "@/hooks/useEvents";
import { EventCard } from "@/components/shared/EventCard";
import { Button } from "@/components/ui/Button";

/**
 * EventosPage - Display and manage campus events
 */
export function EventosPage() {
  const navigate = useNavigate();
  const { events = [], isLoading = false, error = null } = useEvents() as any;
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    let filtered = (events || []);

    if (searchTerm) {
      filtered = filtered.filter(
        (event: any) =>
          (event.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (event.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (event: any) => event.category === categoryFilter
      );
    }

    setFilteredEvents(filtered);
  }, [searchTerm, categoryFilter, events]);

  const handleViewDetails = (id: string) => {
    navigate(`/eventos/${id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Eventos del Campus
          </h1>
          <p className="text-neutral-500">
            Descubre eventos académicos y sociales
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-48 px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="academico">Académico</option>
            <option value="cultural">Cultural</option>
            <option value="deportivo">Deporte</option>
            <option value="otro">Otro</option>
          </select>
          <Button onClick={() => navigate("/crear-evento")}>
            + Nuevo Evento
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 skeleton rounded-lg" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700 text-sm">
            {error}
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && filteredEvents.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event: any) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">
              {searchTerm || categoryFilter !== "all"
                ? "No hay eventos que coincidan con tu búsqueda"
                : "No hay eventos disponibles"}
            </p>
            <Button onClick={() => navigate("/crear-evento")}>
              Crear el primer evento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventosPage;
