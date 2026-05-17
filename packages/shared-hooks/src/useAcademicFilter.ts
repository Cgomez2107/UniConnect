import { useState, useCallback, useMemo } from "react";

export type AcademicFilterMode = "solicitudes" | "compañeros" | "recursos";

export interface BuildFilterParamsResult {
  subjectId?: string;
}

export interface UseAcademicFilterResult {
  selectedSubjectId: string | null;
  mode: AcademicFilterMode;
  selectSubject: (id: string | null) => void;
  setMode: (mode: AcademicFilterMode) => void;
  buildFilterParams: () => BuildFilterParamsResult;
  filterBySubject: <T extends { subjectId?: string; subject?: { id: string } }>(
    items: T[]
  ) => T[];
}

export function useAcademicFilter(initialMode: AcademicFilterMode = "solicitudes"): UseAcademicFilterResult {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [mode, setMode] = useState<AcademicFilterMode>(initialMode);

  const selectSubject = useCallback((id: string | null) => {
    setSelectedSubjectId(id);
  }, []);

  const buildFilterParams = useCallback((): BuildFilterParamsResult => {
    if (!selectedSubjectId) return {};
    return { subjectId: selectedSubjectId };
  }, [selectedSubjectId]);

  const filterBySubject = useCallback(
    <T extends { subjectId?: string; subject?: { id: string } }>(items: T[]): T[] => {
      if (!selectedSubjectId) return items;
      return items.filter((item) => {
        const id = item.subjectId || item.subject?.id;
        return id === selectedSubjectId;
      });
    },
    [selectedSubjectId]
  );

  return {
    selectedSubjectId,
    mode,
    selectSubject,
    setMode,
    buildFilterParams,
    filterBySubject,
  };
}
