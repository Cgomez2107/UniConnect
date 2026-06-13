import * as SplashScreen from "expo-splash-screen"
import { GlobalNotificationModals } from "@/components/notifications/GlobalNotificationModals"
import { RealtimeNotificationHandler } from "@/components/notifications/RealtimeNotificationHandler"
import { ToastProvider } from "@/context"
import { useAuthStore } from "@/store/useAuthStore"
import { ChatbotFAB } from "@/components/chatbot/ChatbotFAB"
import { Stack } from "expo-router"
import { useEffect, useState } from "react"

SplashScreen.preventAutoHideAsync()

if (typeof document !== "undefined") {
  require("../global.css")
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    if (typeof window !== "undefined") {
      const mockUser = (window as any).__E2E_MOCK_AUTH__
      if (mockUser) {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
          isHydrating: false,
        })
        return
      }
    }

    try {
      const unsubscribe = initialize()
      return () => unsubscribe?.()
    } catch (err) {
      console.error("[RootLayout] initialize failed:", err)
    }
  }, [initialize])

  if (!isMounted) {
    return null
  }

  return (
    <ToastProvider>
      <RealtimeNotificationHandler />
      <GlobalNotificationModals />
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
        <Stack.Screen name="ajustes/notificaciones" options={{ presentation: "modal" }} />
        <Stack.Screen name="solicitud/[id]" />
        <Stack.Screen name="study-groups/[id]" />
        <Stack.Screen name="study-groups/[id]/admin" />
        <Stack.Screen name="postular/[id]" />
        <Stack.Screen name="perfil-estudiante/[id]" />
        <Stack.Screen name="recurso/[id]" />
        <Stack.Screen name="estudio/sesiones" />
        <Stack.Screen name="eventos/escanear" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      </Stack>
      {isAuthenticated && <ChatbotFAB />}
    </ToastProvider>
  )
}
