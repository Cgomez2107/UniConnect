/**
 * components/ui/PrimaryButton.tsx
 * Botón principal con soporte de carga y deshabilitado
 */

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: isDisabled ? C.border : C.primary,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {isLoading ? (
        <ActivityIndicator color={C.textOnPrimary} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: isDisabled ? C.textSecondary : C.textOnPrimary },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});