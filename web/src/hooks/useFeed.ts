import { useState, useCallback, useEffect } from "react";
import { StudyRequestUI } from "@/types/ui";
import type { StudyApplication, StudyGroup } from "@uniconnect/shared-types";
import studyGroupsService from "@/lib/services/studyGroups.service";
import { mapStudyRequestApiToUI } from "@/utils/mappers";

interface UseFeedState {
  requests: StudyRequestUI[];
  applications: StudyApplication[];
  isLoading: boolean;
  error: string | null;
}

interface UseFeedOptions {
  autoLoad?: boolean;
  userId?: string;
  subjectId?: string;
}

export default function useFeed(options: UseFeedOptions = { autoLoad: true }) {
  const { autoLoad = true, userId, subjectId } = options;
  const [state, setState] = useState<UseFeedState>({
    requests: [],
    applications: [],
    isLoading: false,
    error: null,
  });

  const loadRequests = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      let apps: StudyApplication[] = [];
      const data: StudyGroup[] = await studyGroupsService.listStudyGroups(subjectId);
      try {
        apps = userId ? await studyGroupsService.listMyApplications() : [];
      } catch {
        apps = [];
      }
      const mapped = data.map((item) => mapStudyRequestApiToUI(item as any));
      if (data.length > 0) {
        console.debug("[useFeed] Primer item raw:", JSON.stringify(data[0], null, 2));
      }
      setState({ requests: mapped, applications: apps, isLoading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando feed";
      console.error("Error loading feed:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [subjectId, userId]);

  const refresh = useCallback(() => {
    return loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (autoLoad) {
      loadRequests();
    }
  }, [autoLoad, loadRequests]);

  return {
    requests: state.requests,
    applications: state.applications,
    isLoading: state.isLoading,
    error: state.error,
    loadRequests,
    refresh,
  };
}
