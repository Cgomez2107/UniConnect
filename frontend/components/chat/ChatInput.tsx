/**
 * components/chat/ChatInput.tsx
 *
 * Barra inferior de entrada de mensaje.
 * - TextInput multilinea (máx 4 líneas)
 * - Botón enviar (deshabilitado si está vacío o enviando)
 * - Respeta safe area inferior (notch / home indicator)
 */

import { Colors } from "@/constants/Colors";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}

export function ChatInput({ value, onChangeText, onSend, sending }: Props) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const canSend = value.trim().length > 0 && !sending;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Escribe un mensaje..."
        placeholderTextColor={C.textPlaceholder}
        multiline
        maxLength={1000}
        numberOfLines={4}
        style={[
          styles.input,
          {
            backgroundColor: C.background,
            color: C.text,
            borderColor: C.border,
          },
        ]}
        onSubmitEditing={canSend ? onSend : undefined}
        blurOnSubmit={false}
      />

      <TouchableOpacity
        onPress={onSend}
        disabled={!canSend}
        style={[
          styles.sendBtn,
          {
            backgroundColor: canSend ? C.primary : C.border,
          },
        ]}
        activeOpacity={0.8}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.sendIcon}>➤</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  sendIcon: {
    fontSize: 18,
    color: "#fff",
  },
});
