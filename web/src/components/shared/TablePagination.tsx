interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalFiltered: number;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function TablePagination({
  page,
  totalPages,
  totalFiltered,
  onPageChange,
  onPrev,
  onNext,
}: TablePaginationProps) {
  if (totalFiltered === 0) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-200 bg-white">
      <span className="text-sm text-neutral-500">
        {totalFiltered} registro{totalFiltered !== 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              p === page
                ? "bg-primary-500 text-white border-primary-500"
                : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
