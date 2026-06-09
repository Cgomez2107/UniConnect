import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";
import AdminModal from "@/components/admin/AdminModal";
import { useTableControls } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/shared/TablePagination";
import type { Subject } from "@/types";

export function MateriasPage() {
  const { subjects, programs, loading, error, getSubjects, getPrograms, createSubject, updateSubject, deleteSubject, submitting } = useAdmin();
  const table = useTableControls<Subject>(subjects, ["name", "code"]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formProgramIds, setFormProgramIds] = useState<string[]>([]);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    getSubjects();
    getPrograms();
  }, [getSubjects, getPrograms]);

  const openCreate = () => {
    setEditId(null);
    setFormName("");
    setFormProgramIds([]);
    setModalError("");
    setModalVisible(true);
  };

  const openEdit = (item: { id: string; name: string; programs?: { id: string }[] }) => {
    setEditId(item.id);
    setFormName(item.name);
    setFormProgramIds((item.programs ?? []).map((p) => p.id));
    setModalError("");
    setModalVisible(true);
  };

  const toggleProgramId = (pid: string) => {
    setFormProgramIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      setModalError("El nombre no puede estar vacío.");
      return;
    }
    if (formProgramIds.length === 0) {
      setModalError("Vincula al menos un programa.");
      return;
    }
    try {
      if (editId) {
        await updateSubject(editId, name, formProgramIds);
      } else {
        await createSubject(name, formProgramIds);
      }
      setModalVisible(false);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteSubject(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-600">
          Gestión de Materias
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
            {subjects.length} materias
          </span>
          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            + Nueva Materia
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">Cargando materias...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="text-neutral-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">No hay materias</p>
          <p className="text-neutral-400 text-sm mt-1">No se encontraron materias activas</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
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
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Programas</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {table.pageData.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-neutral-500 font-mono">
                    {s.id.slice(0, 8)}...
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-neutral-800">
                    {s.name}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {s.code || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">
                    {s.programs && s.programs.length > 0
                      ? s.programs.map((p) => p.name).join(", ")
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      s.is_active
                        ? "bg-success-50 text-success-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {s.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-sm text-primary-600 hover:text-primary-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
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
        title={editId ? "Editar materia" : "Nueva materia"}
        error={modalError}
        submitting={submitting}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      >
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Nombre de la materia *
        </label>
        <input
          type="text"
          value={formName}
          onChange={(e) => { setFormName(e.target.value); setModalError(""); }}
          placeholder="Ej: Cálculo Diferencial"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
          autoFocus
        />

        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Programas vinculados * (selección múltiple)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {programs.map((p) => {
            const selected = formProgramIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProgramId(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  selected
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white text-neutral-600 border-neutral-300 hover:border-primary-300"
                }`}
              >
                {p.name}
                {selected && (
                  <span className="ml-1 text-white text-opacity-70">{p.faculty_name ? `(${p.faculty_name})` : ""}</span>
                )}
              </button>
            );
          })}
        </div>
        {formProgramIds.length > 0 && (
          <p className="text-xs text-primary-600 font-medium">
            {formProgramIds.length} programa(s) seleccionado(s)
          </p>
        )}
      </AdminModal>
    </div>
  );
}
