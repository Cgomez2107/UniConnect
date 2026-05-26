import { useState, useCallback, useEffect, useMemo } from "react";
import { StudyRequestUI } from "@/types/ui";
import type { StudyApplication, StudyGroup } from "@uniconnect/shared-types";
import studyGroupsService from "@/lib/services/studyGroups.service";
import { mapStudyRequestApiToUI } from "@/utils/mappers";

const PAGE_SIZE = 10;

interface UseFeedState {
  requests: StudyRequestUI[];
  applications: StudyApplication[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
}

interface UseFeedOptions {
  autoLoad?: boolean;
  userId?: string;
  subjectId?: string;
  subjectIds?: string[];
}

export default function useFeed(options: UseFeedOptions = { autoLoad: true }) {
  const { autoLoad = true, userId, subjectId, subjectIds } = options;
  const [state, setState] = useState<UseFeedState>({
    requests: [],
    applications: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: true,
  });

  const [page, setPage] = useState(1);

  const subjectIdsKey = subjectIds?.length ? subjectIds.join("|") : "";
  const effectiveSubjectIds = useMemo(() => {
    if (subjectIdsKey) {
      return subjectIds ?? [];
    }

    if (subjectId) {
      return [subjectId];
    }

    return [];
  }, [subjectIdsKey, subjectId]);

  const loadPage = useCallback(async (pageToLoad: number, reset = false) => {
    if (!effectiveSubjectIds.length) {
      setState((prev) => ({
        ...prev,
        requests: [],
        applications: [],
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: reset ? true : prev.isLoading,
      isLoadingMore: !reset,
      error: null,
    }));

    try {
      let apps: StudyApplication[] = [];
      const pages = await Promise.all(
        effectiveSubjectIds.map((id) =>
          studyGroupsService.listStudyGroups({
            subjectId: id,
            page: pageToLoad,
            limit: PAGE_SIZE,
          }),
        ),
      );

      const data = pages.flat();

      try {
        apps = userId ? await studyGroupsService.listMyApplications() : [];
      } catch {
        apps = [];
      }

      const mapped = data.map((item) => mapStudyRequestApiToUI(item as any));
      if (data.length > 0) {
        console.debug("[useFeed] Primer item raw:", JSON.stringify(data[0], null, 2));
      }

      setState((prev) => ({
        requests: (reset ? mapped : [...prev.requests, ...mapped])
          .filter((request, index, array) => array.findIndex((item) => item.id === request.id) === index)
          .sort((left, right) => {
            const leftTime = new Date(left.createdAt).getTime();
            const rightTime = new Date(right.createdAt).getTime();
            return rightTime - leftTime;
          }),
        applications: apps.length > 0 ? apps : prev.applications,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: pages.some((pageItems) => pageItems.length === PAGE_SIZE),
      }));
      setPage(pageToLoad);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error cargando feed";
      console.error("Error loading feed:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: errorMessage,
      }));
    }
  }, [effectiveSubjectIds, userId]);

  const loadRequests = useCallback(async () => {
    return loadPage(1, true);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) return Promise.resolve();
    return loadPage(page + 1, false);
  }, [loadPage, page, state.hasMore, state.isLoading, state.isLoadingMore]);

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
    isLoadingMore: state.isLoadingMore,
    error: state.error,
    hasMore: state.hasMore,
    loadRequests,
    loadMore,
    refresh,
  };
}
