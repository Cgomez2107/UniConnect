/**
 * components/ui/SplashLoader.tsx
 * Pantalla de carga mostrada mientras se determina el rol del usuario
 * Muestra diseño diferente para admin vs estudiante
 */

import { Colors } from "@/constants/Colors";
import { UserRole } from "@/store/useAuthStore";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";

interface SplashLoaderProps {
  role?: UserRole;
  message?: string;
}

export function SplashLoader({ role, message }: SplashLoaderProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  const isAdmin = role === "admin";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isAdmin ? C.primary : C.background },
      ]}
    >
      {/* Logo */}
      <View
        style={[
          styles.logoBox,
          {
            borderColor: isAdmin ? C.accent : C.primary,
            backgroundColor: isAdmin ? "rgba(255,255,255,0.1)" : "transparent",
          },
        ]}
      >
        <Text
          style={[
            styles.logoText,
            { color: isAdmin ? C.accent : C.primary },
          ]}
        >
          UC
        </Text>
        <View
          style={[
            styles.logoDot,
            { backgroundColor: isAdmin ? C.accent : C.accent },
          ]}
        />
      </View>

      <Text
        style={[
          styles.appName,
          { color: isAdmin ? C.textOnPrimary : C.textPrimary },
        ]}
      >
        UniConnect
      </Text>

      {/* Badge de rol */}
      {role && (
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: isAdmin
                ? C.accent
                : C.primary + "20",
              borderColor: isAdmin ? C.accent : C.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.roleText,
              { color: isAdmin ? C.primary : C.primary },
            ]}
          >
            {isAdmin ? "⚙️  Panel Administrador" : "🎓  Portal Estudiante"}
          </Text>
        </View>
      )}

      {/* Spinner */}
      <ActivityIndicator
        size="large"
        color={isAdmin ? C.accent : C.primary}
        style={styles.spinner}
      />

      {message && (
        <Text
          style={[
            styles.message,
            { color: isAdmin ? "rgba(255,255,255,0.7)" : C.textSecondary },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 4,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  roleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  spinner: {
    marginTop: 8,
  },
  message: {
    fontSize: 13,
  },
});