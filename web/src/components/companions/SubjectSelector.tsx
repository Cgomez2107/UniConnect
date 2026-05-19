import React, { useState, useRef, useEffect } from "react";

interface SubjectItem {
  id: string;
  name: string;
}

interface SubjectSelectorProps {
  subjects: SubjectItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function SubjectSelector({ subjects, selectedId, onSelect }: SubjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedName = subjects.find((s) => s.id === selectedId)?.name;

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm text-neutral-900 dark:text-white hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
      >
        <span className={selectedName ? "" : "text-neutral-400"}>
          {selectedName || "Seleccionar materia"}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl shadow-lg overflow-hidden">
          {selectedId && (
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors border-b border-neutral-100 dark:border-neutral-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Quitar filtro
            </button>
          )}
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => { onSelect(subject.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                selectedId === subject.id
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              {subject.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
