/**
 * components/ui/AuthInput.tsx
 * Input reutilizable para formularios de autenticación
 */

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function AuthInput({
  label,
  error,
  isPassword = false,
  ...props
}: AuthInputProps) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const [isFocused, setIsFocused] = useState(false);
  const [showText, setShowText] = useState(false);

  const borderColor = error
    ? C.borderError
    : isFocused
    ? C.borderFocus
    : C.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>

      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: C.surface,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: C.textPrimary }]}
          placeholderTextColor={C.textPlaceholder}
          secureTextEntry={isPassword && !showText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowText((v) => !v)}
            style={styles.eyeBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.eyeText, { color: C.textSecondary }]}>
              {showText ? "👁‍🗨" : "👁"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: C.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  eyeBtn: {
    paddingLeft: 10,
  },
  eyeText: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});