import { useEffect } from "react";
import useAdmin from "@/hooks/useAdmin";
import { useTableControls } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/shared/TablePagination";
import type { AdminRequest } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  abierta: "Abierta",
  cerrada: "Cerrada",
  expirada: "Expirada",
};

const STATUS_COLORS: Record<string, string> = {
  abierta: "bg-success-50 text-success-700",
  cerrada: "bg-neutral-100 text-neutral-500",
  expirada: "bg-error-50 text-error-700",
};

export function AdminSolicitudesPage() {
  const { requests, loading, error, getRequests, closeRequest, deleteRequest } = useAdmin();
  const table = useTableControls<AdminRequest>(requests, ["title", "subject_name", "author_name", "status"]);

  useEffect(() => {
    getRequests();
  }, [getRequests]);

  const handleClose = async (item: { id: string; title: string }) => {
    if (!window.confirm(`¿Cerrar "${item.title}"? El autor ya no recibirá postulaciones.`)) return;
    try {
      await closeRequest(item.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cerrar solicitud");
    }
  };

  const handleDelete = async (item: { id: string; title: string }) => {
    if (!window.confirm(`¿Eliminar "${item.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteRequest(item.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar solicitud");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-600">
          Gestión de Solicitudes
        </h2>
        <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
          {requests.length} solicitudes
        </span>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">Cargando solicitudes...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="text-neutral-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">No hay solicitudes</p>
          <p className="text-neutral-400 text-sm mt-1">No se encontraron solicitudes de estudio</p>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 bg-white">
            <input
              type="text"
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
              placeholder="Buscar por título, materia, autor o estado..."
              className="w-full max-w-xs px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Título</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Materia</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Autor</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Postulaciones</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Creado</th>
                <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {table.pageData.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-neutral-800">
                    {r.title}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {r.subject_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">
                    {r.author_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {r.applications_count}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || "bg-neutral-100 text-neutral-600"}`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-400">
                    {new Date(r.created_at).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status === "abierta" && (
                      <button
                        onClick={() => handleClose(r)}
                        className="text-sm text-amber-600 hover:text-amber-800 mr-3"
                      >
                        Cerrar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r)}
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
    </div>
  );
}
