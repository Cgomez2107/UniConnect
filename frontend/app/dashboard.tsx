import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { ActivityIndicator, View } from "react-native";

export default function DashboardDeepLinkHandler() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  useEffect(() => {
    if (isHydrating) return; // Esperar a que zustand lea el storage
    
    if (isAuthenticated) {
      // Si el usuario tiene sesión, lo enviamos al feed móvil
      router.replace("/(tabs)");
    } else {
      // Si no tiene sesión, al login
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrating]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#0d2852" />
    </View>
  );
}
