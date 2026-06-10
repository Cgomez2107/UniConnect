import { useMemo, useState } from "react";

const PAGE_SIZE = 10;

export interface TableControlsResult<T> {
  page: number;
  totalPages: number;
  totalFiltered: number;
  pageData: T[];
  search: string;
  setSearch: (val: string) => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function useTableControls<T extends Record<string, any>>(
  data: T[],
  searchFields: (keyof T)[],
): TableControlsResult<T> {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = normalizeText(search.trim());
    return data.filter((item) =>
      searchFields.some((field) => {
        const val = item[field];
        return val != null && normalizeText(String(val)).includes(q);
      }),
    );
  }, [data, search, searchFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageData = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  return {
    page: safePage,
    totalPages,
    totalFiltered: filtered.length,
    pageData,
    search,
    setSearch: (val: string) => {
      setSearch(val);
      setPage(1);
    },
    setPage,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
  };
}
