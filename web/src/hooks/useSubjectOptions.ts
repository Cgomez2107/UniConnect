import { useCallback, useEffect, useMemo, useState } from "react";
import { deps } from "@/store/deps";

export interface SubjectOption {
  id: string;
  name: string;
}

interface UseSubjectOptionsResult {
  subjects: SubjectOption[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

function uniqueById(items: SubjectOption[]): SubjectOption[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function useSubjectOptions(fallbackSubjects?: SubjectOption[]): UseSubjectOptionsResult {
  const [subjects, setSubjects] = useState<SubjectOption[]>(fallbackSubjects ?? []);
  const [isLoading, setIsLoading] = useState(false);

  const fallback = useMemo(() => uniqueById(fallbackSubjects ?? []), [fallbackSubjects]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const mySubjects = await deps.apiClients.profiles.getMySubjects();
      const mapped = uniqueById(
        (mySubjects ?? []).map((subject: any) => ({
          id: String(subject.subjectId ?? subject.subject?.id ?? subject.subjects?.id ?? subject.id ?? ""),
          name: String(
            subject.subject?.name ??
            subject.subjects?.name ??
            subject.name ??
            "Materia"
          ),
        }))
      );
      setSubjects(mapped.length > 0 ? mapped : fallback);
    } catch {
      setSubjects(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [fallback]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { subjects, isLoading, refresh };
}

export default useSubjectOptions;
