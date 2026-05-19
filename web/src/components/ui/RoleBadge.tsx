import type { MemberRole } from "@/types";

interface RoleBadgeProps {
  role: MemberRole;
  size?: "sm" | "md";
}

const roleConfig: Record<MemberRole, { label: string; light: string; dark: string }> = {
  autor: {
    label: "Creador",
    light: "bg-secondary-50 text-secondary-800 border-secondary-200",
    dark: "dark:bg-secondary-900/30 dark:text-secondary-300 dark:border-secondary-800",
  },
  admin: {
    label: "Admin",
    light: "bg-blue-50 text-blue-800 border-blue-200",
    dark: "dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  miembro: {
    label: "Miembro",
    light: "bg-neutral-100 text-neutral-700 border-neutral-300",
    dark: "dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-600",
  },
};

const sizeMap = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const config = roleConfig[role];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${config.light} ${config.dark} ${sizeMap[size]}`}
    >
      {config.label}
    </span>
  );
}
