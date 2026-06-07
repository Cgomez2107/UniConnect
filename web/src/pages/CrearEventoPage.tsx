import { useState } from "react";
import { useNavigate } from "react-router-dom";
import eventsService from "@/lib/services/events.service";
import { Button } from "@/components/ui/Button";
import useNotifications from "@/hooks/useNotifications";
import { useEventsStore } from "@/store/useEventsStore";

export function CrearEventoPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useNotifications();
  const addEvent = useEventsStore((s) => s.addEvent);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    category: "academico",
  });

  const isValid =
    form.title.trim().length > 0 &&
    form.eventDate.trim().length > 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;

    setSaving(true);
    try {
      const isoDate = new Date(form.eventDate).toISOString();
      const newEvent = await eventsService.createEvent({
        title: form.title.trim(),
        description: form.description.trim() || "Sin descripción",
        startAt: isoDate,
        endAt: isoDate,
        location: form.location.trim() || "Por definir",
        category: form.category,
      });
      // Inject into global store for immediate visibility in event list
      if (newEvent) addEvent(newEvent as any);
      success("Evento creado exitosamente");
      navigate("/eventos");
    } catch (err: any) {
      showError(err?.message || "Error al crear el evento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/eventos")}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Volver a eventos
        </button>

        <h1 className="text-2xl font-bold text-neutral-900 mb-6">
          Crear Nuevo Evento
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Título *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Nombre del evento"
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe el evento..."
              rows={4}
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Fecha y hora *
            </label>
            <input
              name="eventDate"
              type="datetime-local"
              value={form.eventDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Ubicación
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Salón, auditorio, etc."
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Categoría
            </label>
            <select
              name="category"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="academico">Académico</option>
              <option value="cultural">Cultural</option>
              <option value="deportivo">Deportivo</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} disabled={!isValid}>
              Crear Evento
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/eventos")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CrearEventoPage;
