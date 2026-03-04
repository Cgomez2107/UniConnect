/**
 * app/index.tsx
 * Router de entrada — determina a dónde va el usuario según su sesión y rol
 */

import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, useColorScheme, View } from "react-native";

export default function IndexScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Damos un tick para que Zustand termine de hidratar
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (!isAuthenticated) {
      router.replace("/onboarding" as any);
      return;
    }

    if (user?.role === "admin") {
      // Navegamos a la pantalla index dentro del grupo (admin)
      router.replace("/(admin)" as any);
    } else {
      router.replace("/(tabs)" as any);
    }
  }, [ready, isAuthenticated, user?.role]);

  // Spinner mientras decide
  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});