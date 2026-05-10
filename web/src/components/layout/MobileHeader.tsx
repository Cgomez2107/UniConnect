import { Menu, X } from "lucide-react";

interface MobileHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileHeader({ isOpen, onToggle }: MobileHeaderProps) {
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
      <div className="w-10" />
    </header>
  );
}
