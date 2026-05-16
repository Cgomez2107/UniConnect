import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import companionsService, { CompanionStudentUI } from "@/lib/services/companions.service";

interface UseCompanionsState {
  companions: CompanionStudentUI[];
  allStudents: CompanionStudentUI[];
  isLoading: boolean;
  error: string | null;
}

export default function useCompanions(subjectId?: string) {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<UseCompanionsState>({
    companions: [],
    allStudents: [],
    isLoading: false,
    error: null,
  });

  const loadCompanions = useCallback(async () => {
    if (!user?.id) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const allStudents = subjectId
        ? await companionsService.getStudentsBySubject(subjectId)
        : await companionsService.getAllStudents();

      const mySubjectIds =
        (user as any).subjects?.map((s: any) => s.id) ||
        (user as any).studySubjects?.map((s: any) => s.id) ||
        [];

      let filtered = allStudents.filter((student) => student.id !== user.id);

      const withSharedSubjects = filtered.map((s) => ({
        ...s,
        sharedSubjectIds: subjectId ? [subjectId] : [],
      }));

      setState({
        companions: withSharedSubjects,
        allStudents,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error cargando compañeros";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [subjectId, user]);

  useEffect(() => {
    loadCompanions();
  }, [loadCompanions]);

  return {
    companions: state.companions,
    allStudents: state.allStudents,
    isLoading: state.isLoading,
    error: state.error,
    refresh: loadCompanions,
  };
}
