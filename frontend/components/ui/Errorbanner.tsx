/**
 * components/ui/ErrorBanner.tsx
 * Muestra errores globales de formulario
 */

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ErrorBannerProps {
  message: string;
  onClose?: () => void;
}

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
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
      <Text style={[styles.icon, { color: C.error }]}>⚠️</Text>
      <Text style={[styles.text, { color: C.error }]}>{message}</Text>
      {onClose ? (
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar mensaje de error"
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.closeText, { color: C.error }]}>x</Text>
        </TouchableOpacity>
      ) : null}
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  icon: { fontSize: 14, lineHeight: 18 },
  text: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  closeButton: {
    marginLeft: 6,
    marginTop: -1,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 16,
  },
});
