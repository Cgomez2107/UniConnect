import { useEffect } from "react";
import useAdmin from "@/hooks/useAdmin";
import { useTableControls } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/shared/TablePagination";
import type { AdminUser } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  estudiante: "Estudiante",
  moderador: "Moderador",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  estudiante: "bg-blue-50 text-blue-700",
  moderador: "bg-amber-50 text-amber-700",
};

export function UsuariosPage() {
  const { profiles, loading, error, getProfiles, updateUserRole, toggleUserActive } = useAdmin();
  const table = useTableControls<AdminUser>(profiles, ["full_name", "email", "role"]);

  useEffect(() => {
    getProfiles();
  }, [getProfiles]);

  const handleToggleRole = async (item: { id: string; full_name: string; role: string }) => {
    const newRole = item.role === "admin" ? "estudiante" : "admin";
    if (!window.confirm(`¿Cambiar "${item.full_name}" a ${newRole === "admin" ? "Admin" : "Estudiante"}?`)) return;
    try {
      await updateUserRole(item.id, newRole as "admin" | "estudiante");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cambiar rol");
    }
  };

  const handleToggleActive = async (item: { id: string; full_name: string; is_active: boolean }) => {
    const action = item.is_active ? "suspender" : "activar";
    if (!window.confirm(`¿${action === "suspender" ? "Suspender" : "Activar"} a "${item.full_name}"?`)) return;
    try {
      await toggleUserActive(item.id, !item.is_active);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al cambiar estado");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-600">
          Gestión de Usuarios
        </h2>
        <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
          {profiles.length} usuarios
        </span>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500">Cargando usuarios...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && profiles.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="text-neutral-300 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <p className="text-neutral-500 text-lg font-medium">No hay usuarios</p>
          <p className="text-neutral-400 text-sm mt-1">No se encontraron usuarios registrados</p>
        </div>
      )}

      {!loading && !error && profiles.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 bg-white">
            <input
              type="text"
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o rol..."
              className="w-full max-w-xs px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Usuario</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Correo</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Rol</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Semestre</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Registro</th>
                <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {table.pageData.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-semibold">
                        {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="text-sm font-medium text-neutral-800">
                        {u.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {u.email}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ROLE_COLORS[u.role] || "bg-neutral-100 text-neutral-600"
                    }`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">
                    {u.semester ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.is_active
                        ? "bg-success-50 text-success-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-400">
                    {new Date(u.created_at).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleToggleRole(u)}
                      className="text-sm text-primary-600 hover:text-primary-800 mr-3"
                    >
                      Cambiar Rol
                    </button>
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-sm ${u.is_active ? "text-amber-600 hover:text-amber-800" : "text-success-600 hover:text-success-800"}`}
                    >
                      {u.is_active ? "Suspender" : "Activar"}
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
