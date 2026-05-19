import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "../../constants/navigation";
import { useUnreadCountStore } from "../../store/useUnreadCountStore";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const totalUnread = useUnreadCountStore((s) => s.totalUnread);

  const MESSAGE_ROUTES = ["/mensajes", "/chat"];

  const handleNavigate = (route: string) => {
    navigate(route);
    onNavigate?.();
  };

  return (
    <aside
      className={`flex flex-col bg-primary-900 text-white transition-all duration-300 h-full ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-3 border-b border-white/10">
        {!collapsed && (
          <span className="text-lg font-bold tracking-wide">UniConnect</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.route ||
            (item.route !== "/" && location.pathname.startsWith(item.route));
          const Icon = item.icon;
          const isMessageNav = MESSAGE_ROUTES.includes(item.route);
          const showUnread = isMessageNav && totalUnread > 0;

          return (
            <button
              key={item.route}
              onClick={() => handleNavigate(item.route)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                isActive
                  ? "bg-white/10 text-primary-300"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="relative">
                <Icon
                  size={22}
                  className={isActive ? "text-primary-300" : "text-white/70"}
                />
                {showUnread && (
                  <span className="absolute -top-1.5 -right-1.5 bg-error-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none shadow-lg">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                  {showUnread && (
                    <span className="ml-2 bg-error-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/40">UniConnect v1.0</p>
        </div>
      )}
    </aside>
  );
}
