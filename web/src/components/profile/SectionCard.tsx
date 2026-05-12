import React from "react";

interface SectionCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({ title, action, children, className = "" }: SectionCardProps) {
  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
