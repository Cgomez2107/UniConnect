import React from "react";

export interface UserSubjectItem {
  id: string;
  name: string;
}

interface SubjectFilterProps {
  subjects: UserSubjectItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  totalCount?: number;
}

export function SubjectFilter({
  subjects,
  selectedId,
  onSelect,
  totalCount,
}: SubjectFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          !selectedId
            ? "bg-primary-600 text-white shadow-sm"
            : "card text-neutral-700 hover:bg-neutral-50"
        }`}
      >
        Todas {totalCount !== undefined ? `(${totalCount})` : ""}
      </button>
      {subjects.map((subject) => (
        <button
          key={subject.id}
          onClick={() => onSelect(subject.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedId === subject.id
              ? "bg-primary-600 text-white shadow-sm"
              : "card text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          {subject.name}
        </button>
      ))}
    </div>
  );
}
