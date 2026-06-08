import { useEffect, useState } from "react";
import useAdmin from "@/hooks/useAdmin";
import AdminModal from "@/components/admin/AdminModal";

export function ProgramasPage() {
  const { programs, faculties, loading, error, getPrograms, getFaculties, createProgram, updateProgram, deleteProgram, submitting } = useAdmin();

  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formFacultyId, setFormFacultyId] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    getPrograms();
    getFaculties();
  }, [getPrograms, getFaculties]);

  const openCreate = () => {
    setEditId(null);
    setFormName("");
    setFormFacultyId("");
    setModalError("");
    setModalVisible(true);
  };

  const openEdit = (item: { id: string; name: string; faculty_id: string }) => {
    setEditId(item.id);
    setFormName(item.name);
    setFormFacultyId(item.faculty_id);
    setModalError("");
    setModalVisible(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    if (!name) {
      setModalError("El nombre no puede estar vacío.");
      return;
    }
    if (!formFacultyId) {
      setModalError("Selecciona una facultad.");
      return;
    }
    try {
      if (editId) {
        await updateProgram(editId, { name, faculty_id: formFacultyId });
      } else {
        await createProgram(name, formFacultyId);
      }
      setModalVisible(false);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteProgram(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-600">
          Gestión de Programas
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
            {programs.length} programas
          </span>
          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            + Nuevo Programa
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">Cargando programas...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && programs.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="text-neutral-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l-9 5 9 5 9-5-9-5zm0 0l-9-5v7m18-7v7" />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">No hay programas</p>
          <p className="text-neutral-400 text-sm mt-1">No se encontraron programas académicos activos</p>
        </div>
      )}

      {!loading && !error && programs.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">ID</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Nombre</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Facultad</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Código</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {programs.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-neutral-500 font-mono">
                    {p.id.slice(0, 8)}...
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-neutral-800">
                    {p.name}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">
                    {p.faculty_name || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {p.code || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.is_active
                        ? "bg-success-50 text-success-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {p.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-sm text-primary-600 hover:text-primary-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-sm text-error-600 hover:text-error-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        visible={modalVisible}
        title={editId ? "Editar programa" : "Nuevo programa"}
        error={modalError}
        submitting={submitting}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      >
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Nombre del programa *
        </label>
        <input
          type="text"
          value={formName}
          onChange={(e) => { setFormName(e.target.value); setModalError(""); }}
          placeholder="Ej: Ingeniería de Sistemas"
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
          autoFocus
        />

        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Facultad *
        </label>
        <select
          value={formFacultyId}
          onChange={(e) => { setFormFacultyId(e.target.value); setModalError(""); }}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Seleccionar facultad...</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </AdminModal>
    </div>
  );
}
