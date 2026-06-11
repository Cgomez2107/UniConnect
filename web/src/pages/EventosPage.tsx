import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useEventsSync } from "@/hooks";
import { useEventSubscriptionStore } from "@/store/useEventSubscriptionStore";
import { useEventCategories } from "@/hooks/useEventCategories";
import { useAuthStore } from "@/store/useAuthStore";
import { EventCard } from "@/components/shared/EventCard";
import eventsService from "@/lib/services/events.service";
import type { CampusEventUI } from "@/types/ui";
import useNotifications from "@/hooks/useNotifications";

const CATEGORY_ICONS = ["🎓", "🎭", "⚽", "📌", "🎨", "💡", "🌍", "🎵"];

const STATUS_LABELS: Record<string, string> = {
  published: "Activos",
  cancelled: "Cancelados",
  finished: "Finalizados",
};

const STATUS_COLORS: Record<string, string> = {
  published: "#16a34a",
  cancelled: "#dc2626",
  finished: "#6b7280",
};

export function EventosPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"campus" | "mis-eventos">("campus");
  const subscribedCategories = useEventSubscriptionStore((s) => s.subscribedCategories);
  const toggleSubscription = useEventSubscriptionStore((s) => s.toggle);
  const isSubscribed = (slug: string) => subscribedCategories.includes(slug);
  const dbCategories = useEventCategories();
  const user = useAuthStore((s) => s.user);
  const { success, error: showError } = useNotifications();

  const categories = useMemo(() => {
    return dbCategories.map((c, i) => ({
      slug: c.slug,
      name: c.name,
      icon: CATEGORY_ICONS[i % CATEGORY_ICONS.length],
    }));
  }, [dbCategories]);

  useEventsSync();

  // ── Campus tab state ──
  const [campusEvents, setCampusEvents] = useState<CampusEventUI[]>([]);
  const [campusMeta, setCampusMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [campusLoading, setCampusLoading] = useState(false);
  const [campusError, setCampusError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("published");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.length >= 3 ? searchInput : "");
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const loadCampusEvents = useCallback(async () => {
    setCampusLoading(true);
    setCampusError(null);
    try {
      const filters: Record<string, any> = { page, perPage: 10, status: selectedStatus };
      if (debouncedSearch) filters.search = debouncedSearch;
      if (selectedCategories.length > 0) filters.categories = selectedCategories.join(",");
      const result = await eventsService.listEventsPaginated(filters as any);
      setCampusEvents(result.data);
      setCampusMeta(result.meta);
    } catch (err: any) {
      setCampusError(err?.message || "Error al cargar eventos");
      setCampusEvents([]);
    } finally {
      setCampusLoading(false);
    }
  }, [page, debouncedSearch, selectedCategories, selectedStatus]);

  useEffect(() => {
    if (activeTab === "campus") loadCampusEvents();
  }, [activeTab, loadCampusEvents]);

  const toggleCategory = useCallback((slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
    );
    setPage(1);
  }, []);

  const clearCategories = useCallback(() => {
    setSelectedCategories([]);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((status: string) => {
    setSelectedStatus(status);
    setPage(1);
  }, []);

  const hasActiveCategoryFilter = selectedCategories.length > 0;
  const hasActiveFilter = hasActiveCategoryFilter || debouncedSearch !== "";

  // ── Mis Eventos tab state ──
  const [myEvents, setMyEvents] = useState<CampusEventUI[]>([]);
  const [loadingMyEvents, setLoadingMyEvents] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "mis-eventos" || !user?.id) return;
    setLoadingMyEvents(true);
    eventsService.listEvents({ createdBy: user.id })
      .then(setMyEvents)
      .catch(() => {})
      .finally(() => setLoadingMyEvents(false));
  }, [activeTab, user?.id]);

  const handlePublish = useCallback(async (eventId: string) => {
    setPublishingId(eventId);
    try {
      await eventsService.publishEvent(eventId);
      success("Evento publicado exitosamente");
      setMyEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "published" } : e)),
      );
    } catch (err: any) {
      showError(err?.message || "Error al publicar el evento");
    } finally {
      setPublishingId(null);
    }
  }, [success, showError]);

  const handleCancel = useCallback(async (eventId: string) => {
    setCancellingId(eventId);
    try {
      await eventsService.cancelEvent(eventId);
      success("Evento cancelado exitosamente");
      setMyEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "cancelled" } : e)),
      );
    } catch (err: any) {
      showError(err?.message || "Error al cancelar el evento");
    } finally {
      setCancellingId(null);
    }
  }, [success, showError]);

  const handleViewDetails = (id: string) => navigate(`/eventos/${id}`);

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                Eventos
              </h1>
              <p className="text-neutral-500 text-sm">
                Descubre eventos académicos, culturales y deportivos
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/crear-evento")}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            + Crear Evento
          </button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab("campus")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "campus"
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Eventos del Campus
          </button>
          <button
            onClick={() => setActiveTab("mis-eventos")}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "mis-eventos"
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Mis Eventos
          </button>
        </div>

        {activeTab === "campus" && (
          <>
            <div className="mb-6 space-y-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
              />

              {/* Status filter pills */}
              <div className="flex gap-2 flex-wrap items-center">
                {(["published", "cancelled"] as const).map((s) => {
                  const active = selectedStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "text-white shadow-sm"
                          : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                      style={active ? { backgroundColor: STATUS_COLORS[s] } : undefined}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>

              {/* Category filter pills */}
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={clearCategories}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !hasActiveCategoryFilter
                      ? "bg-primary-600 text-white shadow-sm"
                      : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  Todas
                </button>
                {categories.map(({ slug, name, icon }) => {
                  const active = selectedCategories.includes(slug);
                  return (
                    <button
                      key={slug}
                      onClick={() => toggleCategory(slug)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary-600 text-white shadow-sm"
                          : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <span className="mr-1.5">{icon}</span>
                      {name}
                    </button>
                  );
                })}
                {hasActiveFilter && (
                  <button
                    onClick={() => { clearCategories(); setSearchInput(""); setDebouncedSearch(""); }}
                    className="px-3 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium ml-1"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Total count */}
              {!campusLoading && campusMeta.total > 0 && (
                <p className="text-sm text-neutral-500 font-medium">
                  {campusMeta.total} {campusMeta.total === 1 ? "evento encontrado" : "eventos encontrados"}
                </p>
              )}
            </div>

            {campusLoading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 skeleton rounded-lg" />
                ))}
              </div>
            )}

            {campusError && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4 text-error-700 text-sm mb-6">
                {campusError}
              </div>
            )}

            {!campusLoading && campusEvents.length === 0 && (
              <div className="text-center py-16">
                <p className="text-neutral-500 mb-4">
                  {hasActiveFilter
                    ? "No hay eventos que coincidan con tu búsqueda"
                    : "No hay eventos disponibles"}
                </p>
              </div>
            )}

            {!campusLoading && campusEvents.length > 0 && (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campusEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onViewDetails={handleViewDetails}
                      highlight={debouncedSearch}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {campusMeta.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        page <= 1
                          ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                          : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      ← Anterior
                    </button>
                    <span className="text-sm text-neutral-600 font-medium">
                      {page} / {campusMeta.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(campusMeta.totalPages, p + 1))}
                      disabled={page >= campusMeta.totalPages}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        page >= campusMeta.totalPages
                          ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                          : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "mis-eventos" && (
          <>
            {loadingMyEvents && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-56 skeleton rounded-lg" />
                ))}
              </div>
            )}

            {!loadingMyEvents && myEvents.length === 0 && (
              <div className="text-center py-16">
                <p className="text-neutral-500 mb-4">
                  No has creado ningún evento aún
                </p>
                <button
                  onClick={() => navigate("/crear-evento")}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  + Crear primer evento
                </button>
              </div>
            )}

            {!loadingMyEvents && myEvents.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myEvents.map((event: any) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onViewDetails={handleViewDetails}
                    onEdit={(id) => navigate(`/crear-evento?edit=${id}`)}
                    onPublish={handlePublish}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EventosPage;