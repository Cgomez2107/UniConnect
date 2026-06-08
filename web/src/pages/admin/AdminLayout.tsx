import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  FileText,
  FolderOpen,
  Calendar,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface AdminNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Moderación", path: "/admin/moderacion", icon: ShieldAlert },
  { label: "Facultades", path: "/admin/facultades", icon: Building2 },
  { label: "Programas", path: "/admin/programas", icon: GraduationCap },
  { label: "Materias", path: "/admin/materias", icon: BookOpen },
  { label: "Usuarios", path: "/admin/usuarios", icon: Users },
  { label: "Solicitudes", path: "/admin/solicitudes", icon: FileText },
  { label: "Recursos", path: "/admin/recursos", icon: FolderOpen },
  { label: "Eventos", path: "/admin/eventos", icon: Calendar },
  { label: "Métricas", path: "/admin/metricas", icon: BarChart3 },
];

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-primary-900 text-white transition-all duration-300 h-full ${
          sidebarCollapsed ? "w-16" : "w-60"
        } flex-shrink-0`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-3 border-b border-white/10">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-primary-300" />
              <span className="text-base font-bold tracking-wide">Admin</span>
            </div>
          )}
          {sidebarCollapsed && (
            <Shield size={20} className="text-primary-300 mx-auto" />
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Sidebar navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  closeMobileMenu();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-white/10 text-primary-300"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={22} className={isActive ? "text-primary-300" : "text-white/70"} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer with user info */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-t border-white/10">
            <p className="text-xs text-white/40 truncate">
              {user ? `${user.firstName} ${user.lastName}` : "Admin"}
            </p>
          </div>
        )}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile drawer sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <aside className="flex flex-col bg-primary-900 text-white h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-primary-300" />
              <span className="text-base font-bold tracking-wide">Admin</span>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    closeMobileMenu();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-white/10 text-primary-300"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    size={22}
                    className={isActive ? "text-primary-300" : "text-white/70"}
                  />
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top header bar */}
        <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 text-neutral-600"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-neutral-500">
              <Shield size={18} className="text-primary-500" />
              <span className="text-sm font-semibold text-primary-600">
                Panel de Administración
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600 hidden sm:block">
              {user ? `${user.firstName} ${user.lastName}` : ""}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-error-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-error-50"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Mobile horizontal tabs (visible only on small screens below lg) */}
        <div className="lg:hidden overflow-x-auto border-b border-neutral-200 bg-white">
          <div className="flex px-2 min-w-max">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
