import { SplashLoader } from "@/components/ui/SplashLoader";
import { DIContainer } from "@/lib/services/di/container";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as Linking from "expo-linking";

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T
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

export default function OAuthCallbackScreen() {
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
  const [waitExpired, setWaitExpired] = useState(false);
  const [hardTimeoutExpired, setHardTimeoutExpired] = useState(false);

  const getSessionUser = async () => {
    const session = await withTimeout(getCurrentSession.execute(), 2500, null);
    return session?.user ?? null;
  };

  const waitForSessionUser = async (attempts = 5, delayMs = 350) => {
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
  };

  const resolveRoleForRouting = async (
    fallbackRole: "estudiante" | "admin"
  ): Promise<"estudiante" | "admin"> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const profile = await withTimeout(getMyAuthProfile.execute(), 4000, null);
      if (profile?.role) return profile.role;
      if (attempt < 1) await sleep(500);
    }

    return fallbackRole;
  };

  useEffect(() => {
    const t = setTimeout(() => setWaitExpired(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHardTimeoutExpired(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const routeByRole = (role: "estudiante" | "admin") => {
    if (lastRoutedRoleRef.current === role) {
      return;
    }
    lastRoutedRoleRef.current = role;

    if (role === "admin") {
      router.replace("/(admin)" as any);
      return;
    }
    router.replace("/(tabs)" as any);
  };

  const routeByRoleOptimistic = (fallbackRole: "estudiante" | "admin") => {
    // Fast path: route immediately, then correct only if backend resolves admin.
    routeByRole(fallbackRole);

    resolveRoleForRouting(fallbackRole)
      .then((resolvedRole) => {
        if (resolvedRole !== fallbackRole) {
          routeByRole(resolvedRole);
        }
      })
      .catch(() => {});
  };

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
        try {
          await resolveOAuthSession.execute(incomingUrl);
        } catch {
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

          router.replace("/login" as any);
          return;
        }
      }

      const email = sessionUser.email?.toLowerCase() ?? "";
      if (!email.endsWith("@ucaldas.edu.co")) {
        await signOutUser.execute();
        router.replace("/login" as any);
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
    })().catch(() => {
      router.replace("/login" as any);
    }).finally(() => {
      recoveringRef.current = false;
    });

  }, [incomingUrl, isAuthenticated, isHydrating, user, waitExpired, setUser]);

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

      router.replace("/login" as any);
    })();
  }, [hardTimeoutExpired, isAuthenticated, isHydrating]);

  return <SplashLoader message="Iniciando sesión..." />;
}
