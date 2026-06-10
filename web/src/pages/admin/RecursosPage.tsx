import { useEffect } from "react";
import useAdmin from "@/hooks/useAdmin";
import { useTableControls } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/shared/TablePagination";
import type { AdminResource } from "@/types";

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
  xls: "XLS",
  xlsx: "XLSX",
  ppt: "PPT",
  pptx: "PPTX",
  jpg: "Imagen",
  jpeg: "Imagen",
  png: "Imagen",
  gif: "Imagen",
  mp4: "Video",
  link: "Enlace",
};

export function AdminRecursosPage() {
  const { resources, loading, error, getResources, deleteResource } = useAdmin();
  const table = useTableControls<AdminResource>(resources, ["title", "file_type", "subject_name", "author_name"]);

  useEffect(() => {
    getResources();
  }, [getResources]);

  const formatFileSize = (kb: number | null) => {
    if (kb == null) return "—";
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleDelete = async (item: { id: string; title: string }) => {
    if (!window.confirm(`¿Eliminar "${item.title}"? El archivo también será eliminado.`)) return;
    try {
      await deleteResource(item.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar recurso");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-600">
          Gestión de Recursos
        </h2>
        <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
          {resources.length} recursos
        </span>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">Cargando recursos...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && resources.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="text-neutral-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">No hay recursos</p>
          <p className="text-neutral-400 text-sm mt-1">No se encontraron recursos académicos</p>
        </div>
      )}

      {!loading && !error && resources.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 bg-white">
            <input
              type="text"
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
              placeholder="Buscar por nombre, tipo, materia o creador..."
              className="w-full max-w-xs px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Nombre</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Tamaño</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Materia</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Creador</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Subido</th>
                <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {table.pageData.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-neutral-800">
                    {r.title}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                      {FILE_TYPE_LABELS[r.file_type?.toLowerCase() ?? ""] || r.file_type || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {formatFileSize(r.file_size_kb)}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {r.subject_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-600">
                    {r.author_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-400">
                    {new Date(r.created_at).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
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
