import React from "react";

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export default function InfoRow({ label, value, className = "" }: InfoRowProps) {
  return (
    <div className={`flex items-start gap-2 py-2 ${className}`}>
      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-300 min-w-[90px]">{label}</span>
      <span className="text-sm text-neutral-900 dark:text-white flex-1">{value}</span>
    </div>
  );
}
