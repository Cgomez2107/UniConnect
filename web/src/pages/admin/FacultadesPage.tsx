import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";
import AdminModal from "@/components/admin/AdminModal";
import { useTableControls } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/shared/TablePagination";
import type { Faculty } from "@/types";

export function FacultadesPage() {
  const { faculties, loading, error, getFaculties, createFaculty, updateFaculty, deleteFaculty, submitting } = useAdmin();
  const table = useTableControls<Faculty>(faculties, ["name", "code"]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    getFaculties();
  }, [getFaculties]);

  const openCreate = () => {
    setEditId(null);
    setFormName("");
    setModalError("");
    setModalVisible(true);
  };

  const openEdit = (item: { id: string; name: string }) => {
    setEditId(item.id);
    setFormName(item.name);
    setModalError("");
    setModalVisible(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      setModalError("El nombre no puede estar vacío.");
      return;
    }
    try {
      if (editId) {
        await updateFaculty(editId, { name });
      } else {
        await createFaculty(name);
      }
      setModalVisible(false);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteFaculty(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-600">
          Gestión de Facultades
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
            {faculties.length} facultades
          </span>
          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            + Nueva Facultad
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">Cargando facultades...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && faculties.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="text-neutral-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">No hay facultades</p>
          <p className="text-neutral-400 text-sm mt-1">No se encontraron facultades activas</p>
        </div>
      )}

      {!loading && !error && faculties.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 bg-white">
            <input
              type="text"
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full max-w-xs px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">ID</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Nombre</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Código</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Creado</th>
                <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {table.pageData.map((f) => (
                <tr key={f.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-neutral-500 font-mono">
                    {f.id.slice(0, 8)}...
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-neutral-800">
                    {f.name}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {f.code || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-400">
                    {new Date(f.created_at).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEdit(f)}
                      className="text-sm text-primary-600 hover:text-primary-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(f.id, f.name)}
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
            page={table.page}
            totalPages={table.totalPages}
            totalFiltered={table.totalFiltered}
            onPageChange={table.setPage}
            onPrev={table.prevPage}
            onNext={table.nextPage}
          />
        </div>
      )}

      <AdminModal
        visible={modalVisible}
        title={editId ? "Editar facultad" : "Nueva facultad"}
        error={modalError}
        submitting={submitting}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      >
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Nombre de la facultad *
        </label>
        <input
          type="text"
          value={formName}
          onChange={(e) => { setFormName(e.target.value); setModalError(""); }}
          placeholder="Ej: Ingeniería"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          autoFocus
        />
      </AdminModal>
    </div>
  );
}
