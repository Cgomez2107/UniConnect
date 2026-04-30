import { useAuthStore } from "@/store/useAuthStore";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

/**
 * Root layout component. Initializes authentication state listeners
 * and declares all available routes in the application.
 */
export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== "undefined") {
      const mockUser = (window as any).__E2E_MOCK_AUTH__;
      if (mockUser) {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
          isHydrating: false,
        });
        return;
      }
    }

    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Si no ha montado en el cliente, renderizamos un contenedor vacío o neutral
  // para que coincida perfectamente con el HTML estático del servidor.
  if (!isMounted) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="oauth-callback" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="chat/[conversationId]" />
      <Stack.Screen name="nueva-solicitud"  options={{ presentation: "modal" }} />
      <Stack.Screen name="subir-recurso"    options={{ presentation: "modal" }} />
      <Stack.Screen name="editar-perfil"    options={{ presentation: "modal" }} />
      <Stack.Screen name="solicitud/[id]" />
      <Stack.Screen name="postular/[id]" />
      <Stack.Screen name="perfil-estudiante/[id]" />
      <Stack.Screen name="recurso/[id]" />
    </Stack>
  );
}