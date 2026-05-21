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
    filterBySubject: <T extends {
        subjectId?: string;
        subject?: {
            id: string;
        };
    }>(items: T[]) => T[];
}
export declare function useAcademicFilter(initialMode?: AcademicFilterMode): UseAcademicFilterResult;
//# sourceMappingURL=useAcademicFilter.d.ts.map