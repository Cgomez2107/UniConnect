import * as SplashScreen from "expo-splash-screen"
import { Colors } from "@/constants/Colors"
import { useAuthStore } from "@/store/useAuthStore"
import { router } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from "react-native"

export default function IndexScreen() {
  const scheme = useColorScheme() ?? "light"
  const C = Colors[scheme]

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isHydrating = useAuthStore((s) => s.isHydrating)
  const role = useAuthStore((s) => s.user?.role)

  const [ready, setReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const lastRouteRef = useRef<string | null>(null)
  const splashed = useRef(false)

  // 1. Release native splash screen on first render
  useEffect(() => {
    if (!splashed.current) {
      splashed.current = true
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [])

  // 2. Short delay so router is ready
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  // 3. Safety timeout: if hydration takes > 5s, force redirect to login
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      if (isHydrating) {
        console.warn("[IndexScreen] Hydration timeout — forcing redirect")
        setTimedOut(true)
      }
    }, 5000)
    return () => clearTimeout(t)
  }, [ready, isHydrating])

  // 4. Route decision
  const decide = useCallback(() => {
    if (timedOut || !isAuthenticated) return "/login"
    return role === "admin" ? "/(admin)" : "/(tabs)"
  }, [timedOut, isAuthenticated, role])

  useEffect(() => {
    if (!ready) return
    if (isHydrating && !timedOut) return

    const nextRoute = decide()
    if (lastRouteRef.current === nextRoute) return
    lastRouteRef.current = nextRoute
    router.replace(nextRoute as any)
  }, [ready, isHydrating, isAuthenticated, role, timedOut, decide])

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ActivityIndicator size="large" color={C.primary} />
      {timedOut && (
        <Text style={[styles.timeoutText, { color: C.textSecondary }]}>
          El servidor está tardando más de lo esperado. Redirigiendo al login…
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  timeoutText: { fontSize: 13, textAlign: "center", marginHorizontal: 32 },
})
