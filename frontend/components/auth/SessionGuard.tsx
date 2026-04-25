import { SplashLoader } from "@/components/ui/SplashLoader";
import { useAuthStore, type UserRole } from "@/store/useAuthStore";
import { Redirect, useRouter, useSegments } from "expo-router";
import { PropsWithChildren, useEffect, useMemo } from "react";

type GuardTargetRoute = "/(tabs)" | "/(admin)";
type GuardTargetSegment = "(tabs)" | "(admin)";

interface SessionGuardProps extends PropsWithChildren {
  allowedRoles?: UserRole[];
  loginRoute?: "/login";
}

function resolveHomeByRole(role: UserRole): { route: GuardTargetRoute; segment: GuardTargetSegment } {
  if (role === "admin") {
    return { route: "/(admin)", segment: "(admin)" };
  }

  return { route: "/(tabs)", segment: "(tabs)" };
}

/**
 * Protects private route groups using auth state from Zustand.
 * Handles anonymous redirects and role mismatches in a platform-safe way.
 */
export function SessionGuard({
  children,
  allowedRoles,
  loginRoute = "/login",
}: SessionGuardProps) {
  const router = useRouter();
  const segments = useSegments();

  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const currentSegment = useMemo(() => {
    const first = segments[0];
    return typeof first === "string" ? first : null;
  }, [segments]);

  const roleAllowed = useMemo(() => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  }, [allowedRoles, user]);

  useEffect(() => {
    if (isHydrating || !isAuthenticated || !user || roleAllowed) {
      return;
    }

    const target = resolveHomeByRole(user.role);
    if (currentSegment === target.segment) {
      return;
    }

    router.replace(target.route);
  }, [currentSegment, isAuthenticated, isHydrating, roleAllowed, router, user]);

  if (isHydrating) {
    return <SplashLoader message="Verificando sesión..." />;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href={loginRoute} />;
  }

  if (!roleAllowed) {
    return <SplashLoader message="Validando permisos..." />;
  }

  return <>{children}</>;
}
