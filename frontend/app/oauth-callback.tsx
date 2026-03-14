import { SplashLoader } from "@/components/ui/SplashLoader";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

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

interface ProfileRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: "estudiante" | "admin";
  semester: number | null;
  bio: string | null;
}

const fetchProfileByUserId = async (userId: string): Promise<ProfileRow | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, semester, bio")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as ProfileRow | null;
};

export default function OAuthCallbackScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const recoveringRef = useRef(false);
  const [waitExpired, setWaitExpired] = useState(false);
  const [hardTimeoutExpired, setHardTimeoutExpired] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWaitExpired(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHardTimeoutExpired(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const routeByRole = (role: "estudiante" | "admin") => {
    if (role === "admin") {
      router.replace("/(admin)" as any);
      return;
    }
    router.replace("/(tabs)" as any);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      routeByRole(user.role);
      return;
    }

    if (!waitExpired || recoveringRef.current) return;

    recoveringRef.current = true;

    (async () => {
      const session = await withTimeout(
        supabase.auth.getSession().then((result) => result.data.session),
        2500,
        null
      );
      const sessionUser = session?.user;

      if (!sessionUser) {
        router.replace("/login" as any);
        return;
      }

      const email = sessionUser.email?.toLowerCase() ?? "";
      if (!email.endsWith("@ucaldas.edu.co")) {
        await supabase.auth.signOut();
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

      const profile = await withTimeout<ProfileRow | null>(
        fetchProfileByUserId(sessionUser.id),
        2500,
        null
      );

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
      routeByRole(resolvedUser.role);
    })().catch(() => {
      router.replace("/login" as any);
    }).finally(() => {
      recoveringRef.current = false;
    });

  }, [isAuthenticated, user, waitExpired, setUser]);

  useEffect(() => {
    if (!hardTimeoutExpired || isAuthenticated) return;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          router.replace("/index" as any);
          return;
        }
      } catch {
        // Si no se puede leer sesión, continuamos a login.
      }

      router.replace("/login" as any);
    })();
  }, [hardTimeoutExpired, isAuthenticated]);

  return <SplashLoader message="Iniciando sesión..." />;
}
