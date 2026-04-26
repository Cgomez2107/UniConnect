import { DIContainer } from "@/lib/services/di/container";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";

type OAuthLoginErrorType = "domain_rejected" | "oauth_cancelled" | "oauth_failed";

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useOAuthCallbackFlow() {
  const container = DIContainer.getInstance();
  const getCurrentSession = container.getGetCurrentSession();
  const getMyAuthProfile = container.getGetMyAuthProfile();
  const resolveOAuthSession = container.getResolveSessionFromOAuthUrl();
  const signOutUser = container.getSignOutUser();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const incomingUrl = Linking.useURL();
  const recoveringRef = useRef(false);
  const lastRoutedRoleRef = useRef<"estudiante" | "admin" | null>(null);
  const lastProcessedUrlRef = useRef<string | null>(null);
  const pendingLoginErrorRef = useRef<OAuthLoginErrorType | null>(null);
  const [waitExpired, setWaitExpired] = useState(false);
  const [hardTimeoutExpired, setHardTimeoutExpired] = useState(false);

  const getParamFromUrl = useCallback((url: string, key: string) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`[?#&]${escapedKey}=([^&#]*)`, "i");
    const match = url.match(pattern);
    if (!match?.[1]) return null;

    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }, []);

  const getOAuthErrorTypeFromUrl = useCallback((url: string): OAuthLoginErrorType | null => {
    const rawError = getParamFromUrl(url, "error")?.toLowerCase() ?? "";
    const rawDescription = getParamFromUrl(url, "error_description")?.toLowerCase() ?? "";

    if (!rawError && !rawDescription) {
      return null;
    }

    if (rawError.includes("access_denied") || rawDescription.includes("cancel")) {
      return "oauth_cancelled";
    }

    return "oauth_failed";
  }, [getParamFromUrl]);

  const getEmailFromAccessToken = useCallback((url: string) => {
    const accessToken = getParamFromUrl(url, "access_token");
    if (!accessToken) return null;

    const parts = accessToken.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

    try {
      if (typeof atob !== "function") return null;
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded) as { email?: string };
      return parsed.email?.toLowerCase() ?? null;
    } catch {
      return null;
    }
  }, [getParamFromUrl]);

  const replaceLoginWithError = useCallback((errorType?: OAuthLoginErrorType | null) => {
    const effectiveError = errorType ?? pendingLoginErrorRef.current;
    if (effectiveError) {
      pendingLoginErrorRef.current = effectiveError;
      router.replace(`/login?error_type=${encodeURIComponent(effectiveError)}` as any);
      return;
    }

    router.replace("/login" as any);
  }, []);

  const getSessionUser = useCallback(async () => {
    const session = await withTimeout(getCurrentSession.execute(), 2500, null);
    return session?.user ?? null;
  }, [getCurrentSession]);

  const waitForSessionUser = useCallback(async (attempts = 5, delayMs = 350) => {
    for (let attempt = 0; attempt < attempts; attempt++) {
      const sessionUser = await getSessionUser();
      if (sessionUser) {
        return sessionUser;
      }

      if (attempt < attempts - 1) {
        await sleep(delayMs);
      }
    }

    return null;
  }, [getSessionUser]);

  const resolveRoleForRouting = useCallback(async (
    fallbackRole: "estudiante" | "admin",
  ): Promise<"estudiante" | "admin"> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const profile = await withTimeout(getMyAuthProfile.execute(), 4000, null);
      if (profile?.role) return profile.role;
      if (attempt < 1) await sleep(500);
    }

    return fallbackRole;
  }, [getMyAuthProfile]);

  const routeByRole = useCallback((role: "estudiante" | "admin") => {
    if (lastRoutedRoleRef.current === role) {
      return;
    }
    lastRoutedRoleRef.current = role;

    if (role === "admin") {
      router.replace("/(admin)" as any);
      return;
    }
    router.replace("/(tabs)" as any);
  }, []);

  const routeByRoleOptimistic = useCallback((fallbackRole: "estudiante" | "admin") => {
    routeByRole(fallbackRole);

    resolveRoleForRouting(fallbackRole)
      .then((resolvedRole) => {
        if (resolvedRole !== fallbackRole) {
          routeByRole(resolvedRole);
        }
      })
      .catch(() => {});
  }, [resolveRoleForRouting, routeByRole]);

  useEffect(() => {
    const t = setTimeout(() => setWaitExpired(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHardTimeoutExpired(true), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      routeByRoleOptimistic(user.role);
      return;
    }

    if ((!waitExpired && !incomingUrl) || recoveringRef.current) return;

    recoveringRef.current = true;

    (async () => {
      if (incomingUrl && lastProcessedUrlRef.current !== incomingUrl) {
        lastProcessedUrlRef.current = incomingUrl;
        pendingLoginErrorRef.current = getOAuthErrorTypeFromUrl(incomingUrl);

        const oauthEmail = getEmailFromAccessToken(incomingUrl);
        if (oauthEmail && !oauthEmail.endsWith("@ucaldas.edu.co")) {
          pendingLoginErrorRef.current = "domain_rejected";
          await signOutUser.execute();
          replaceLoginWithError("domain_rejected");
          return;
        }

        try {
          await resolveOAuthSession.execute(incomingUrl);
        } catch {
          pendingLoginErrorRef.current = pendingLoginErrorRef.current ?? "oauth_failed";
          // Continuamos con recuperación por sesión/store.
        }
      }

      let sessionUser = await getSessionUser();

      if (!sessionUser) {
        const currentState = useAuthStore.getState();
        if (currentState.isAuthenticated && currentState.user) {
          routeByRoleOptimistic(currentState.user.role);
          return;
        }

        sessionUser = await waitForSessionUser();

        if (!sessionUser) {
          const lateState = useAuthStore.getState();
          if (lateState.isAuthenticated && lateState.user) {
            routeByRoleOptimistic(lateState.user.role);
            return;
          }

          if (lateState.isHydrating) {
            return;
          }

          replaceLoginWithError(pendingLoginErrorRef.current);
          return;
        }
      }

      const email = sessionUser.email?.toLowerCase() ?? "";
      if (!email.endsWith("@ucaldas.edu.co")) {
        await signOutUser.execute();
        replaceLoginWithError("domain_rejected");
        return;
      }

      const fallbackUser = {
        id: sessionUser.id,
        email: sessionUser.email!,
        fullName: sessionUser.user_metadata?.full_name ?? "Estudiante",
        avatarUrl: sessionUser.user_metadata?.avatar_url ?? null,
        phoneNumber: null,
        role: "estudiante" as const,
        semester: null,
        bio: null,
      };

      const profile = await withTimeout(getMyAuthProfile.execute(), 4000, null);

      const resolvedUser = profile
        ? {
            ...fallbackUser,
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url,
            role: profile.role,
            semester: profile.semester,
            bio: profile.bio,
          }
        : fallbackUser;

      setUser(resolvedUser);

      const roleForRoute = await resolveRoleForRouting(resolvedUser.role);
      routeByRole(roleForRoute);
    })()
      .catch(() => {
        replaceLoginWithError(pendingLoginErrorRef.current ?? "oauth_failed");
      })
      .finally(() => {
        recoveringRef.current = false;
      });
  }, [incomingUrl, isAuthenticated, isHydrating, user, waitExpired, setUser, resolveOAuthSession, signOutUser, getSessionUser, waitForSessionUser, resolveRoleForRouting, routeByRoleOptimistic, routeByRole, getMyAuthProfile, getOAuthErrorTypeFromUrl, getEmailFromAccessToken, replaceLoginWithError]);

  useEffect(() => {
    if (!hardTimeoutExpired || isAuthenticated) return;
    if (isHydrating) {
      return;
    }

    (async () => {
      try {
        const sessionUser = await getSessionUser();
        if (sessionUser) {
          const roleForRoute = await resolveRoleForRouting("estudiante");
          routeByRole(roleForRoute);
          return;
        }
      } catch {
        // Si no se puede leer sesión, continuamos a login.
      }

      replaceLoginWithError(pendingLoginErrorRef.current);
    })();
  }, [hardTimeoutExpired, isAuthenticated, isHydrating, getSessionUser, resolveRoleForRouting, routeByRole, replaceLoginWithError]);
}
