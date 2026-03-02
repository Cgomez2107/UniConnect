/**
 * components/ui/ErrorBanner.tsx
 * Muestra errores globales de formulario
 */

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StyleSheet, Text, View } from "react-native";

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  if (!message) return null;

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: C.errorBackground, borderColor: C.borderError },
      ]}
    >
      <Text style={[styles.text, { color: C.error }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});