import { useState, useEffect, useRef } from "react";
import profilesService from "@/lib/services/profiles.service";

const cache = new Map<string, { fullName: string | null; avatarUrl: string | null }>();

export function useProfileNames(userIds: string[]) {
  const [names, setNames] = useState<Map<string, { fullName: string | null; avatarUrl: string | null }>>(new Map());
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const missing = userIds.filter(
      (uid) => !cache.has(uid) && !fetchedRef.current.has(uid)
    );

    if (missing.length === 0) {
      const result = new Map<string, { fullName: string | null; avatarUrl: string | null }>();
      for (const uid of userIds) {
        const cached = cache.get(uid);
        if (cached) result.set(uid, cached);
      }
      setNames(result);
      return;
    }

    for (const uid of missing) fetchedRef.current.add(uid);

    let cancelled = false;

    (async () => {
      const results = await Promise.allSettled(
        missing.map((uid) => profilesService.getProfileById(uid))
      );

      if (cancelled) return;

      const result = new Map<string, { fullName: string | null; avatarUrl: string | null }>();

      for (const uid of userIds) {
        const cached = cache.get(uid);
        if (cached) {
          result.set(uid, cached);
          continue;
        }
        const idx = missing.indexOf(uid);
        if (idx !== -1 && results[idx].status === "fulfilled") {
          const profile = (results[idx] as PromiseFulfilledResult<any>).value;
          const data = {
            fullName: profile.full_name || profile.fullName || null,
            avatarUrl: profile.avatar_url || profile.avatarUrl || null,
          };
          cache.set(uid, data);
          result.set(uid, data);
        } else {
          result.set(uid, { fullName: null, avatarUrl: null });
        }
      }

      if (!cancelled) setNames(result);
    })();

    return () => { cancelled = true; };
  }, [userIds.join(",")]);

  return names;
}
