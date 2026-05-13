import { Menu, X, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnreadCountStore } from "../../store/useUnreadCountStore";

interface MobileHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileHeader({ isOpen, onToggle }: MobileHeaderProps) {
  const navigate = useNavigate();
  const totalUnread = useUnreadCountStore((s) => s.totalUnread);

  return (
    <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-[#0d2852] text-white">
      <button
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <span className="text-lg font-bold tracking-wide">UniConnect</span>
      <button
        onClick={() => navigate("/mensajes")}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Mensajes"
      >
        <MessageCircle size={22} />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-error-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none shadow-lg">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>
    </header>
  );
}
