import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";
import AdminModal from "@/components/admin/AdminModal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useTableControls } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/shared/TablePagination";
import type { EventCategoryRow, AdminEvent } from "@/types";

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

function getCategoryColor(categories: EventCategoryRow[], id: string): string {
  const idx = categories.findIndex((c) => c.id === id);
  return CATEGORY_COLORS[idx >= 0 ? idx % CATEGORY_COLORS.length : 0];
}

function getCategoryName(categories: EventCategoryRow[], id: string): string {
  const cat = categories.find((c) => c.id === id);
  return cat?.name ?? id.slice(0, 8);
}

export function AdminEventosPage() {
  const { events, eventCategories, loading, error, getEvents, getEventCategories, createEvent, updateEvent, deleteEvent, createEventCategory, updateEventCategory, deleteEventCategory, submitting } = useAdmin();

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [modalError, setModalError] = useState("");

  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catModalError, setCatModalError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string; type: "event" | "category" } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const eventsTable = useTableControls<AdminEvent>(events, ["title", "location", "creator_name"]);
  const catSearch = useTableControls<EventCategoryRow>(eventCategories, ["name", "slug", "description"]);

  useEffect(() => {
    getEvents();
    getEventCategories();
  }, [getEvents, getEventCategories]);

  const firstCategoryId = eventCategories.length > 0 ? eventCategories[0].id : "";

  const openCreate = () => {
    setEditId(null);
    setFormTitle("");
    setFormDescription("");
    setFormDate("");
    setFormLocation("");
    setFormCategoryId(firstCategoryId);
    setModalError("");
    setModalVisible(true);
  };

  const openEdit = (item: { id: string; title: string; event_date: string; location: string | null; category_id: string }) => {
    setEditId(item.id);
    setFormTitle(item.title);
    setFormDescription("");
    setFormDate(item.event_date.slice(0, 16));
    setFormLocation(item.location ?? "");
    setFormCategoryId(item.category_id);
    setModalError("");
    setModalVisible(true);
  };

  const handleSave = async () => {
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
    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        event_date: new Date(formDate).toISOString(),
        location: formLocation.trim() || undefined,
        category_id: formCategoryId,
      };
      if (editId) {
        await updateEvent(editId, payload);
      } else {
        await createEvent(payload);
      }
      setModalVisible(false);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

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

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      if (confirmDelete.type === "event") {
        await deleteEvent(confirmDelete.id);
      } else {
        await deleteEventCategory(confirmDelete.id);
      }
      setConfirmDelete(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-600">
          Gestión de Eventos y Categorías
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
            {events.length} eventos
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
          <input
            type="text"
            value={catSearch.search}
            onChange={(e) => catSearch.setSearch(e.target.value)}
            placeholder="Filtrar categorías..."
            className="w-full max-w-xs px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
          />
          {catSearch.totalFiltered === 0 && (
            <p className="text-sm text-neutral-400">No hay categorías disponibles.</p>
          )}
          {catSearch.pageData.map((c) => (
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
                  onClick={() => setConfirmDelete({ id: c.id, title: c.name, type: "category" })}
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

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">Cargando eventos...</p>
        </div>
      )}

      {error && (
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
          <p className="text-neutral-400 text-sm mt-1">Crea el primer evento del campus</p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 bg-white">
            <input
              type="text"
              value={eventsTable.search}
              onChange={(e) => eventsTable.setSearch(e.target.value)}
              placeholder="Buscar por título, lugar o creador..."
              className="w-full max-w-xs px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Título</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Lugar</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Categoría</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Creador</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Registrado</th>
                <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {eventsTable.pageData.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-neutral-800">
                    {e.title}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">
                    {new Date(e.event_date).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {e.location || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(eventCategories, e.category_id)}`}>
                      {getCategoryName(eventCategories, e.category_id)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">
                    {e.creator_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-400">
                    {new Date(e.created_at).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEdit(e)}
                      className="text-sm text-primary-600 hover:text-primary-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: e.id, title: e.title, type: "event" })}
                      className="text-sm text-error-600 hover:text-error-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination
            page={eventsTable.page}
            totalPages={eventsTable.totalPages}
            totalFiltered={eventsTable.totalFiltered}
            onPageChange={eventsTable.setPage}
            onPrev={eventsTable.prevPage}
            onNext={eventsTable.nextPage}
          />
        </div>
      )}

      <AdminModal
        visible={modalVisible}
        title={editId ? "Editar evento" : "Nuevo evento"}
        error={modalError}
        submitting={submitting}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
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

      <ConfirmDialog
        visible={confirmDelete !== null}
        title={confirmDelete?.type === "category" ? "Eliminar categoría" : "Eliminar evento"}
        message={
          deleteError
            ? deleteError
            : confirmDelete?.type === "category"
              ? `¿Eliminar la categoría "${confirmDelete?.title}"?\n\nLos eventos que la usan quedarán sin categoría asignada.`
              : `¿Eliminar "${confirmDelete?.title}"?\n\nEsta acción no se puede deshacer.`
        }
        confirmLabel={deleteError ? "Cerrar" : "Eliminar"}
        variant={deleteError ? "default" : "danger"}
        loading={deleting}
        onConfirm={deleteError ? () => { setConfirmDelete(null); setDeleteError(""); } : handleConfirmDelete}
        onCancel={() => { setConfirmDelete(null); setDeleteError(""); }}
      />
    </div>
  );
}
