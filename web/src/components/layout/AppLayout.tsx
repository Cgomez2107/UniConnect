import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { useNotificationStore } from "../../store/useNotificationStore";

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const notificationUnread = useNotificationStore((s) => s.unreadCount);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar />
      </div>

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
        <Sidebar onNavigate={closeMobileMenu} />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        <MobileHeader
          isOpen={mobileMenuOpen}
          onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        {/* Desktop notification bar */}
        <div className="hidden lg:flex items-center justify-end h-12 px-6 bg-white border-b border-neutral-200">
          <button
            onClick={() => navigate("/notificaciones")}
            className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Notificaciones"
          >
            <Bell size={20} className="text-neutral-600" />
            {notificationUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-error-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none shadow-lg">
                {notificationUnread > 99 ? "99+" : notificationUnread}
              </span>
            )}
          </button>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
