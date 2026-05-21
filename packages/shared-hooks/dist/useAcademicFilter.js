import { useState, useCallback } from "react";
export function useAcademicFilter(initialMode = "solicitudes") {
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [mode, setMode] = useState(initialMode);
    const selectSubject = useCallback((id) => {
        setSelectedSubjectId(id);
    }, []);
    const buildFilterParams = useCallback(() => {
        if (!selectedSubjectId)
            return {};
        return { subjectId: selectedSubjectId };
    }, [selectedSubjectId]);
    const filterBySubject = useCallback((items) => {
        if (!selectedSubjectId)
            return items;
        return items.filter((item) => {
            const id = item.subjectId || item.subject?.id;
            return id === selectedSubjectId;
        });
    }, [selectedSubjectId]);
    return {
        selectedSubjectId,
        mode,
        selectSubject,
        setMode,
        buildFilterParams,
        filterBySubject,
    };
}
//# sourceMappingURL=useAcademicFilter.js.map