import { useEffect, useState, useCallback } from "react";
import useAdmin from "@/hooks/useAdmin";
import { useAdminEvents } from "@/hooks/useAdminEvents";
import AdminModal from "@/components/admin/AdminModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import type { EventCategoryRow, EventStatus } from "@/types";

const CATEGORY_COLORS = [
  "bg-blue-50 text-blue-700",
  "bg-purple-50 text-purple-700",
  "bg-green-50 text-green-700",
  "bg-amber-50 text-amber-700",
  "bg-pink-50 text-pink-700",
  "bg-cyan-50 text-cyan-700",
  "bg-orange-50 text-orange-700",
  "bg-teal-50 text-teal-700",
];

const STATUS_BADGES: Record<EventStatus, { label: string; style: string }> = {
  draft: { label: "Borrador", style: "bg-neutral-100 text-neutral-600" },
  published: { label: "Publicado", style: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", style: "bg-red-100 text-red-700" },
  finished: { label: "Finalizado", style: "bg-blue-100 text-blue-700" },
};

function getCategoryColor(categories: EventCategoryRow[] | undefined, id: string | null | undefined): string {
  if (!id || !Array.isArray(categories)) return CATEGORY_COLORS[0];
  const idx = categories.findIndex((c) => c && (c.id === id || c.slug === id));
  return CATEGORY_COLORS[idx >= 0 ? idx % CATEGORY_COLORS.length : 0];
}

function getCategoryName(categories: EventCategoryRow[] | undefined, id: string | null | undefined): string {
  if (!id || !Array.isArray(categories)) return 'Sin categoría';
  const cat = categories.find((c) => c && (c.id === id || c.slug === id));
  return cat?.name ?? id.slice(0, 8);
}

export function AdminEventosPage() {
  const {
    eventCategories,
    loading: adminLoading,
    error: adminError,
    getEventCategories,
    createEventCategory,
    updateEventCategory,
    deleteEventCategory,
    submitting,
  } = useAdmin();

  const {
    events,
    total,
    page,
    totalPages,
    loading: eventsLoading,
    error: eventsError,
    fetchEvents,
    setPage,
    publishEvent,
    cancelEvent,
    finishEvent,
    softDeleteEvent,
    createEvent,
    updateEvent,
  } = useAdminEvents();

  const [includeDeleted, setIncludeDeleted] = useState(false);

  const loading = adminLoading || eventsLoading;
  const error = adminError || eventsError;

  // Event form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formMaxCapacity, setFormMaxCapacity] = useState("");
  const [modalError, setModalError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Category form state
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catModalError, setCatModalError] = useState("");

  // Confirmation state
  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "cancel" | "finish" | "eventDelete";
    id: string;
    title: string;
  } | null>(null);
  const [confirmError, setConfirmError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [categoryConfirmDelete, setCategoryConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [catDeleteError, setCatDeleteError] = useState("");
  const [catDeleting, setCatDeleting] = useState(false);

  const refreshEvents = useCallback(() => {
    fetchEvents(page, includeDeleted);
  }, [fetchEvents, page, includeDeleted]);

  useEffect(() => {
    getEventCategories();
  }, [getEventCategories]);

  useEffect(() => {
    fetchEvents(page, includeDeleted);
  }, [fetchEvents, page, includeDeleted]);

  const firstCategoryId = eventCategories.length > 0 ? eventCategories[0].id : "";

  const openCreate = () => {
    setEditId(null);
    setFormTitle("");
    setFormDescription("");
    setFormDate("");
    setFormLocation("");
    setFormCategoryId(firstCategoryId);
    setFormMaxCapacity("");
    setModalError("");
    setModalVisible(true);
  };

  const openEdit = (item: { id?: string; title?: string; event_date?: string; description?: string | null; location?: string | null; category_id?: string | null; max_capacity?: number | null }) => {
    setEditId(item.id ?? null);
    setFormTitle(item.title ?? "");
    setFormDescription(item.description ?? "");
    setFormDate(item.event_date?.slice(0, 16) ?? "");
    setFormLocation(item.location ?? "");
    setFormCategoryId(item.category_id ?? firstCategoryId);
    setFormMaxCapacity(item.max_capacity?.toString() ?? "");
    setModalError("");
    setModalVisible(true);
  };

  const handleSaveEvent = async () => {
    if (!formTitle.trim()) {
      setModalError("El título no puede estar vacío.");
      return;
    }
    if (!formDate) {
      setModalError("La fecha del evento es obligatoria.");
      return;
    }
    if (!formCategoryId) {
      setModalError("Selecciona una categoría.");
      return;
    }
    setFormSubmitting(true);
    setModalError("");
    try {
      // Resolver slug de categoría
      const cat = eventCategories.find((c) => c.id === formCategoryId);
      const category = cat?.slug ?? "otro";

      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        startAt: new Date(formDate).toISOString(),
        location: formLocation.trim() || undefined,
        category,
        maxCapacity: formMaxCapacity ? parseInt(formMaxCapacity, 10) : null,
      };
      if (editId) {
        await updateEvent(editId, payload);
      } else {
        await createEvent(payload);
      }
      setModalVisible(false);
      refreshEvents();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Category handlers
  const openCreateCategory = () => {
    setCatEditId(null);
    setCatName("");
    setCatDescription("");
    setCatModalError("");
    setCatModalVisible(true);
  };

  const openEditCategory = (item: EventCategoryRow) => {
    setCatEditId(item.id);
    setCatName(item.name);
    setCatDescription(item.description ?? "");
    setCatModalError("");
    setCatModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      setCatModalError("El nombre no puede estar vacío.");
      return;
    }
    try {
      if (catEditId) {
        await updateEventCategory(catEditId, { name: catName.trim(), description: catDescription.trim() || undefined });
      } else {
        await createEventCategory({ name: catName.trim(), description: catDescription.trim() || undefined });
      }
      setCatModalVisible(false);
    } catch (e) {
      setCatModalError(e instanceof Error ? e.message : "Error al guardar categoría");
    }
  };

  // Lifecycle action handlers
  const handleLifecycleAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    setConfirmError("");
    try {
      switch (confirmAction.type) {
        case "publish":
          await publishEvent(confirmAction.id);
          break;
        case "cancel":
          await cancelEvent(confirmAction.id);
          break;
        case "finish":
          await finishEvent(confirmAction.id);
          break;
        case "eventDelete":
          await softDeleteEvent(confirmAction.id);
          break;
      }
      setConfirmAction(null);
      refreshEvents();
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : "Error al ejecutar acción");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCategoryDelete = async () => {
    if (!categoryConfirmDelete) return;
    setCatDeleting(true);
    setCatDeleteError("");
    try {
      await deleteEventCategory(categoryConfirmDelete.id);
      setCategoryConfirmDelete(null);
    } catch (e) {
      setCatDeleteError(e instanceof Error ? e.message : "Error al eliminar categoría");
    } finally {
      setCatDeleting(false);
    }
  };

  const confirmDelete = (id: string, title: string) => {
    setConfirmAction({ type: "eventDelete", id, title });
    setConfirmError("");
  };

  const confirmPublish = (id: string, title: string) => {
    setConfirmAction({ type: "publish", id, title });
    setConfirmError("");
  };

  const confirmCancel = (id: string, title: string) => {
    setConfirmAction({ type: "cancel", id, title });
    setConfirmError("");
  };

  const confirmFinish = (id: string, title: string) => {
    setConfirmAction({ type: "finish", id, title });
    setConfirmError("");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const toggleIncludeDeleted = () => {
    setIncludeDeleted((prev) => !prev);
    setPage(1);
  };

  const getStatusBadge = (e: { status: EventStatus; deleted_at?: string | null }) => {
    if (e.deleted_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-300 text-neutral-700">
          Eliminado
        </span>
      );
    }
    const s = STATUS_BADGES[e.status] ?? STATUS_BADGES.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.style}`}>
        {s.label}
      </span>
    );
  };

  const getActionButtons = (e: { id: string; title: string; status: EventStatus; description: string | null; event_date: string; location: string | null; category_id: string; deleted_at?: string | null }) => {
    if (e.deleted_at) return <span className="text-sm text-neutral-400">—</span>;
    switch (e.status) {
      case "draft":
        return (
          <>
            <button onClick={() => openEdit(e)} className="text-sm text-primary-600 hover:text-primary-800 mr-2">
              Editar
            </button>
            <button onClick={() => confirmPublish(e.id, e.title)} className="text-sm text-green-600 hover:text-green-800 mr-2">
              Publicar
            </button>
            <button onClick={() => confirmDelete(e.id, e.title)} className="text-sm text-error-600 hover:text-error-800">
              Eliminar
            </button>
          </>
        );
      case "published":
        return (
          <button onClick={() => confirmCancel(e.id, e.title)} className="text-sm text-red-600 hover:text-red-800">
            Cancelar
          </button>
        );
      case "cancelled":
      case "finished":
        return <span className="text-sm text-neutral-400">—</span>;
    }
  };

  const getConfirmContent = () => {
    if (!confirmAction) return { title: "", message: "", confirmLabel: "Confirmar", variant: "danger" as const };
    switch (confirmAction.type) {
      case "eventDelete":
        return {
          title: "Eliminar evento",
          message: confirmError || `¿Eliminar "${confirmAction.title}"?\n\nSe marcará como eliminado pero los datos se conservan.`,
          confirmLabel: confirmError ? "Cerrar" : "Eliminar",
          variant: "danger" as const,
        };
      case "publish":
        return {
          title: "Publicar evento",
          message: confirmError || `¿Publicar "${confirmAction.title}"?\n\nEl evento será visible para todos los estudiantes.`,
          confirmLabel: confirmError ? "Cerrar" : "Publicar",
          variant: "default" as const,
        };
      case "cancel":
        return {
          title: "Cancelar evento",
          message: confirmError || `¿Cancelar "${confirmAction.title}"?\n\nLos estudiantes registrados serán notificados.`,
          confirmLabel: confirmError ? "Cerrar" : "Cancelar evento",
          variant: "danger" as const,
        };
      case "finish":
        return {
          title: "Finalizar evento",
          message: confirmError || `¿Finalizar "${confirmAction.title}"?\n\nEl evento se marcará como finalizado.`,
          confirmLabel: confirmError ? "Cerrar" : "Finalizar",
          variant: "default" as const,
        };
    }
  };

  const confirmContent = getConfirmContent();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-600">
          Gestión de Eventos y Categorías
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
            {total} eventos
          </span>
          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            + Nuevo Evento
          </button>
        </div>
      </div>

      <details className="mb-6 group">
        <summary className="cursor-pointer text-sm font-semibold text-neutral-600 hover:text-primary-600 select-none py-2 px-3 rounded-lg hover:bg-neutral-100 transition-colors">
          Gestión de Categorías ({eventCategories.length})
        </summary>
        <div className="mt-3 space-y-2">
          {eventCategories.length === 0 && (
            <p className="text-sm text-neutral-400">No hay categorías disponibles.</p>
          )}
          {eventCategories.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(eventCategories, c.id)}`}>
                  {c.name}
                </span>
                <code className="text-xs text-neutral-400 font-mono">{c.slug}</code>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditCategory(c)}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  Editar
                </button>
                <button
                  onClick={() => setCategoryConfirmDelete({ id: c.id, title: c.name })}
                  className="text-xs text-error-600 hover:text-error-800"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={openCreateCategory}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium mt-1"
          >
            + Nueva categoría
          </button>
        </div>
      </details>

      {/* Toggle and pagination bar */}
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={toggleIncludeDeleted}
            className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
          />
          Ver eliminados
        </label>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  p === page
                    ? "bg-primary-500 text-white border-primary-500"
                    : "border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">Cargando eventos...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="text-neutral-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">No hay eventos</p>
          <p className="text-neutral-400 text-sm mt-1">
            {includeDeleted ? "No se encontraron eventos eliminados." : "Crea el primer evento del campus"}
          </p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Título</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Lugar</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Categoría</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Creador</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Registrado</th>
                <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {events.map((e, idx) => {
                if (!e || !e.id) return null;
                const eventDate = e.event_date ? new Date(e.event_date) : null;
                const createdDate = e.created_at ? new Date(e.created_at) : null;
                return (
                <tr key={e.id} className={`hover:bg-neutral-50 transition-colors ${e.deleted_at ? "opacity-60" : ""}`}>
                  <td className="px-5 py-3 text-sm font-medium text-neutral-800">
                    {e.title ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">
                    {eventDate ? eventDate.toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }) : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {e.location || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(eventCategories, e.category_id)}`}>
                      {getCategoryName(eventCategories, e.category_id)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {getStatusBadge(e)}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">
                    {e.creator_name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-400">
                    {createdDate ? createdDate.toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {getActionButtons(e)}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                p === page
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Event create/edit modal */}
      <AdminModal
        visible={modalVisible}
        title={editId ? "Editar evento" : "Nuevo evento"}
        error={modalError}
        submitting={formSubmitting}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveEvent}
      >
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Título *
        </label>
        <input
          type="text"
          value={formTitle}
          onChange={(e) => { setFormTitle(e.target.value); setModalError(""); }}
          placeholder="Ej: Semana de la Ingeniería"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
          autoFocus
        />

        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Descripción (opcional)
        </label>
        <textarea
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="Breve descripción del evento..."
          rows={3}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
        />

        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Fecha y hora * (AAAA-MM-DDTHH:mm)
        </label>
        <input
          type="datetime-local"
          value={formDate}
          onChange={(e) => { setFormDate(e.target.value); setModalError(""); }}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
        />

        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Lugar (opcional)
        </label>
        <input
          type="text"
          value={formLocation}
          onChange={(e) => setFormLocation(e.target.value)}
          placeholder="Ej: Auditorio Central"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
        />

        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Cupo Máximo (opcional)
        </label>
        <input
          type="number"
          min={1}
          value={formMaxCapacity}
          onChange={(e) => setFormMaxCapacity(e.target.value)}
          placeholder="Ej: 100"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
        />

        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Categoría *
        </label>
        {eventCategories.length === 0 ? (
          <p className="text-sm text-neutral-400">Crea una categoría primero.</p>
        ) : (
          <select
            value={formCategoryId}
            onChange={(e) => { setFormCategoryId(e.target.value); setModalError(""); }}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4 bg-white"
          >
            {eventCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </AdminModal>

      {/* Category create/edit modal */}
      <AdminModal
        visible={catModalVisible}
        title={catEditId ? "Editar categoría" : "Nueva categoría"}
        error={catModalError}
        submitting={submitting}
        onClose={() => setCatModalVisible(false)}
        onSave={handleSaveCategory}
      >
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Nombre *
        </label>
        <input
          type="text"
          value={catName}
          onChange={(e) => { setCatName(e.target.value); setCatModalError(""); }}
          placeholder="Ej: Conferencia"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          autoFocus
        />

        <label className="block text-sm font-medium text-neutral-700 mb-1 mt-4">
          Descripción (opcional)
        </label>
        <textarea
          value={catDescription}
          onChange={(e) => setCatDescription(e.target.value)}
          placeholder="Descripción breve de la categoría..."
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />

        <p className="text-xs text-neutral-400 mt-2">
          El slug se generará automáticamente desde el nombre.
        </p>
      </AdminModal>

      {/* Event lifecycle confirmation dialog */}
      <ConfirmDialog
        visible={confirmAction !== null}
        title={confirmContent.title}
        message={confirmContent.message}
        confirmLabel={confirmContent.confirmLabel}
        variant={confirmError ? "default" : confirmContent.variant}
        loading={confirmLoading}
        onConfirm={confirmError ? () => { setConfirmAction(null); setConfirmError(""); } : handleLifecycleAction}
        onCancel={() => { setConfirmAction(null); setConfirmError(""); }}
      />

      {/* Category delete confirmation dialog */}
      <ConfirmDialog
        visible={categoryConfirmDelete !== null}
        title="Eliminar categoría"
        message={
          catDeleteError
            ? catDeleteError
            : `¿Eliminar la categoría "${categoryConfirmDelete?.title}"?\n\nLos eventos que la usan quedarán sin categoría asignada.`
        }
        confirmLabel={catDeleteError ? "Cerrar" : "Eliminar"}
        variant={catDeleteError ? "default" : "danger"}
        loading={catDeleting}
        onConfirm={catDeleteError ? () => { setCategoryConfirmDelete(null); setCatDeleteError(""); } : handleCategoryDelete}
        onCancel={() => { setCategoryConfirmDelete(null); setCatDeleteError(""); }}
      />
    </div>
  );
}
