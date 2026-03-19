/**
 * components/chat/ChatInput.tsx
 *
 * Barra inferior de entrada de mensaje.
 * - TextInput multilinea (máx 4 líneas)
 * - Botón enviar (deshabilitado si está vacío o enviando)
 * - Respeta safe area inferior (notch / home indicator)
 */

import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
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
  onTyping: (v: string) => void;
  onSend: () => void;
  onVoicePress: () => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  replyPreview: string | null;
  onClearReply: () => void;
  imagePreviewUri: string | null;
  sending: boolean;
  pickingImage: boolean;
  voiceRecording: boolean;
  voiceElapsedSec: number;
}

export function ChatInput({
  value,
  onChangeText,
  onTyping,
  onSend,
  onVoicePress,
  onPickImage,
  onRemoveImage,
  replyPreview,
  onClearReply,
  imagePreviewUri,
  sending,
  pickingImage,
  voiceRecording,
  voiceElapsedSec,
}: Props) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const hasMedia = !!imagePreviewUri;
  const canSend = (value.trim().length > 0 || hasMedia) && !sending;
  const canQuickAction = !sending && !pickingImage;

  const formatRecordTime = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: C.background,
          borderTopColor: "transparent",
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {imagePreviewUri && (
        <View style={[styles.previewCard, { borderColor: C.border, backgroundColor: C.background }]}>
          <Image source={{ uri: imagePreviewUri }} style={styles.previewImage} />
          <TouchableOpacity
            onPress={onRemoveImage}
            style={[styles.previewRemove, { backgroundColor: C.error }]}
            activeOpacity={0.8}
          >
            <Text style={styles.previewRemoveText}>X</Text>
          </TouchableOpacity>
          <Text style={[styles.previewHint, { color: C.textSecondary }]}>Imagen lista para enviar</Text>
        </View>
      )}

      {replyPreview && (
        <View style={[styles.replyCard, { borderColor: C.border, backgroundColor: C.background }]}>
          <Text style={[styles.replyLabel, { color: C.textSecondary }]}>Respondiendo a</Text>
          <Text style={[styles.replyValue, { color: C.text }]} numberOfLines={2}>
            {replyPreview}
          </Text>
          <TouchableOpacity onPress={onClearReply} style={styles.replyClose}>
            <Text style={[styles.replyCloseText, { color: C.error }]}>X</Text>
          </TouchableOpacity>
        </View>
      )}

      {voiceRecording && (
        <View style={[styles.recordingCard, { borderColor: C.border, backgroundColor: C.surface }]}>
          <View style={styles.recordingRow}>
            <View style={[styles.recordDot, { backgroundColor: C.error }]} />
            <Text style={[styles.recordingText, { color: C.textPrimary }]}>Grabando audio...</Text>
            <Text style={[styles.recordingTimer, { color: C.textSecondary }]}>{formatRecordTime(voiceElapsedSec)}</Text>
          </View>
          <Text style={[styles.recordingHint, { color: C.textSecondary }]}>Toca el boton derecho para enviar</Text>
        </View>
      )}

      <View style={styles.row}>
        <TouchableOpacity
          onPress={onPickImage}
          disabled={pickingImage || sending}
          style={[styles.attachBtn, { backgroundColor: C.surface, borderColor: C.border }]}
          activeOpacity={0.8}
        >
          {pickingImage ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Text style={[styles.attachIcon, { color: C.primary }]}>+</Text>
          )}
        </TouchableOpacity>

        <View style={[styles.inputShell, { backgroundColor: C.surface, borderColor: C.border }]}> 
          <TextInput
            value={value}
            onChangeText={(text) => {
              onChangeText(text)
              onTyping(text)
            }}
            placeholder={hasMedia ? "Agrega un comentario opcional..." : "Escribe un mensaje..."}
            placeholderTextColor={C.textPlaceholder}
            multiline
            maxLength={5000}
            numberOfLines={4}
            style={[
              styles.input,
              {
                color: C.text,
              },
            ]}
            onSubmitEditing={canSend ? onSend : undefined}
            blurOnSubmit={false}
          />
        </View>

        <TouchableOpacity
          onPress={canSend ? onSend : onVoicePress}
          disabled={canSend ? false : !canQuickAction}
          style={[
            styles.sendBtn,
            {
              backgroundColor: canSend ? C.primary : C.surface,
              borderColor: canSend ? C.primary : C.border,
            },
          ]}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator size="small" color={canSend ? "#fff" : C.textSecondary} />
          ) : (
            <Ionicons
              name={canSend ? "send" : voiceRecording ? "stop" : "mic"}
              size={18}
              color={canSend ? "#fff" : C.textSecondary}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  attachIcon: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 22,
  },
  inputShell: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  sendIcon: {
    fontSize: 17,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    position: "relative",
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  previewHint: {
    marginTop: 6,
    fontSize: 12,
  },
  previewRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  previewRemoveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  replyCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: "relative",
  },
  replyLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  replyValue: {
    fontSize: 13,
    marginTop: 2,
    paddingRight: 24,
    lineHeight: 18,
  },
  replyClose: {
    position: "absolute",
    top: 6,
    right: 8,
    padding: 4,
  },
  replyCloseText: {
    fontWeight: "800",
    fontSize: 12,
  },
  recordingCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    fontSize: 13,
    fontWeight: "700",
  },
  recordingTimer: {
    marginLeft: "auto",
    fontSize: 12,
    fontWeight: "600",
  },
  recordingHint: {
    marginTop: 4,
    fontSize: 11,
  },
});
