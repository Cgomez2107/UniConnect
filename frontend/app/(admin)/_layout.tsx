/**
 * app/(admin)/_layout.tsx
 * Layout minimalista del panel admin — sin redirecciones en useEffect
 */

import { useAuthStore } from "@/store/useAuthStore";
import { router, Stack } from "expo-router";
import { useEffect } from "react";

export default function AdminLayout() {
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (role && role !== "admin") {
      router.replace("/(tabs)" as any);
    }
  }, [role]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}