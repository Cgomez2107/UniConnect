import React from "react";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Cargando datos académicos..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
      <p className="text-neutral-500 dark:text-neutral-400 text-sm">{message}</p>
    </div>
  );
}
