/**
 * components/ui/SplashLoader.tsx
 * Pantalla de carga genérica para autenticación y redirección inicial.
 */

import { Colors } from "@/constants/Colors";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";

interface SplashLoaderProps {
  message?: string;
}

export function SplashLoader({ message }: SplashLoaderProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: C.background },
      ]}
    >
      <View
        style={[
          styles.logoBox,
          {
            borderColor: C.primary,
            backgroundColor: "transparent",
          },
        ]}
      >
        <Text
          style={[
            styles.logoText,
            { color: C.primary },
          ]}
        >
          UC
        </Text>
        <View
          style={[
            styles.logoDot,
            { backgroundColor: C.accent },
          ]}
        />
      </View>

      <Text
        style={[
          styles.appName,
          { color: C.textPrimary },
        ]}
      >
        UniConnect
      </Text>

      <ActivityIndicator
        size="large"
        color={C.primary}
        style={styles.spinner}
      />

      {message && (
        <Text
          style={[
            styles.message,
            { color: C.textSecondary },
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
  spinner: {
    marginTop: 8,
  },
  message: {
    fontSize: 13,
  },
});