import React from "react";

interface StatBoxProps {
  value: number;
  label: string;
}

export default function StatBox({ value, label }: StatBoxProps) {
  return (
    <div className="flex flex-col items-center px-6 py-3">
      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{value}</span>
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
    </div>
  );
}
