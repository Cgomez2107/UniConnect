import { SplashLoader } from "@/components/ui/SplashLoader";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export default function OAuthCallbackScreen() {
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
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

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.replace("/(admin)" as any);
      } else {
        router.replace("/(tabs)" as any);
      }
      return;
    }

    if (isHydrating || !waitExpired) return;

    router.replace("/login" as any);
  }, [isHydrating, isAuthenticated, user, waitExpired]);

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
