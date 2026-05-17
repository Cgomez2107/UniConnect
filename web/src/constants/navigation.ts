import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  Calendar,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  route: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Feed", route: "/solicitudes", icon: LayoutDashboard },
  { label: "Grupos", route: "/invitaciones", icon: Users },
  { label: "Recursos", route: "/recursos", icon: BookOpen },
  { label: "Mensajes", route: "/mensajes", icon: MessageSquare },
  { label: "Eventos", route: "/eventos", icon: Calendar },
  { label: "Perfil", route: "/perfil", icon: UserCircle },
];
