import React from "react";
import { Badge } from "@/components/ui/Badge";

interface MiniRequestCardProps {
  title: string;
  subjectName?: string;
  status: string;
  applicationsCount?: number;
  onClick?: () => void;
}

const statusColor: Record<string, "blue" | "green" | "red" | "gray"> = {
  abierta: "green",
  cerrada: "red",
  expirada: "gray",
};

export default function MiniRequestCard({
  title,
  subjectName,
  status,
  applicationsCount,
  onClick,
}: MiniRequestCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors border border-neutral-200 dark:border-neutral-600"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-neutral-900 dark:text-white truncate">{title}</p>
          {subjectName && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{subjectName}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {applicationsCount !== undefined && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{applicationsCount} solicitudes</span>
          )}
          <Badge color={statusColor[status] || "gray"} variant="solid">
            {status}
          </Badge>
        </div>
      </div>
    </button>
  );
}
