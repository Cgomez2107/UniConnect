import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  mapStudyGroupDtoToDomain,
  mapStudyResourceDtoToDomain,
} from "@uniconnect/shared-api";
import { useStudyGroupsStore } from "@/store/useStudyGroupsStore";
import { useResourcesStore } from "@/store/useResourcesStore";
import { useAuthStore } from "@/store/useAuthStore";

const AUTH_SESSION_KEY = "uniconnect-auth-session";

interface StoredSession {
  state?: {
    accessToken?: string | null;
    refreshToken?: string | null;
  };
}

function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return { accessToken: null, refreshToken: null };
    const parsed = JSON.parse(raw) as StoredSession;
    return {
      accessToken: parsed?.state?.accessToken ?? null,
      refreshToken: parsed?.state?.refreshToken ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Hook to set up real-time sync with Supabase for all global entities.
 * Must be mounted once at the root level (App.tsx).
 * Re-subscribes automatically when the user authenticates so that
 * RLS-protected tables (forum_questions, forum_answers, etc.) receive events.
 */
export function useGlobalSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Only subscribe if the user is authenticated to ensure correct token usage
    if (!isAuthenticated) {
      console.log("[useGlobalSync] User is not authenticated, skipping real-time sync setup.");
      return;
    }

    let isSubscribed = true;
    let channel: any = null;

    const setupSync = async () => {
      // 1. Establish the session on the Supabase client using the JWT
      const { accessToken, refreshToken } = getStoredTokens();
      if (accessToken) {
        console.log("[useGlobalSync] Setting Supabase session with token...");
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? "",
        });
      }

      if (!isSubscribed) return;

      // 2. Fetch role directly from Supabase profiles (not from stale store)
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", sbUser.id)
          .single();

        if (profile?.role === "admin") {
          console.log("[useGlobalSync] Admin user detected — skipping student subscriptions.");
          return;
        }
      }

      if (!isSubscribed) return;

      console.log("[useGlobalSync] Initializing database listener (authenticated:", isAuthenticated, ")");

      channel = supabase
        .channel("global-db-sync")
        // 1. Study Groups (study_requests table)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "study_requests" },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            console.debug("[useGlobalSync] study_requests change:", eventType, payload);
            if (eventType === "INSERT") {
              const domain = mapStudyGroupDtoToDomain(newRecord as any);
              useStudyGroupsStore.getState().addGroup(domain);
            } else if (eventType === "UPDATE") {
              const domain = mapStudyGroupDtoToDomain(newRecord as any);
              useStudyGroupsStore.getState().updateGroup(domain);
            } else if (eventType === "DELETE") {
              useStudyGroupsStore.getState().removeGroup(oldRecord.id);
            }
          }
        )
        // 3. Study Resources (study_resources table)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "study_resources" },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            console.debug("[useGlobalSync] study_resources change:", eventType, payload);
            if (eventType === "INSERT") {
              const domain = mapStudyResourceDtoToDomain(newRecord as any);
              useResourcesStore.getState().addResource(domain);
            } else if (eventType === "UPDATE") {
              const domain = mapStudyResourceDtoToDomain(newRecord as any);
              useResourcesStore.getState().updateResource(domain);
            } else if (eventType === "DELETE") {
              useResourcesStore.getState().removeResource(oldRecord.id);
            }
          }
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            console.log("[useGlobalSync] Subscribed to real-time changes");
          } else if (status === "CHANNEL_ERROR") {
            console.error("[useGlobalSync] Channel error — token may be missing, expired or RLS issue:", err);
          }
        });
    };

    setupSync();

    return () => {
      isSubscribed = false;
      if (channel) {
        console.log("[useGlobalSync] Cleaning up database listener...");
        supabase.removeChannel(channel);
      }
    };
    // Re-subscribe whenever auth state changes so the JWT is fresh
  }, [isAuthenticated]);
}
