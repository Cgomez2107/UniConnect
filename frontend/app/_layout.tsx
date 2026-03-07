/**
 * app/_layout.tsx
 * Layout raíz — solo declara rutas que existen como archivos en /app
 */

import { useAuthStore } from "@/store/useAuthStore";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="chat/[conversationId]" />
      <Stack.Screen name="nueva-solicitud"  options={{ presentation: "modal" }} />
      <Stack.Screen name="editar-perfil"    options={{ presentation: "modal" }} />
      <Stack.Screen name="solicitud/[id]" />
      <Stack.Screen name="postular/[id]" />
      <Stack.Screen name="perfil-estudiante/[id]" />
      {/* <Stack.Screen name="register"         options={{ presentation: "modal" }} /> */}
    </Stack>
  );
}