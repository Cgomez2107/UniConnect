/**
 * components/chat/ChatInput.tsx
 *
 * Barra inferior de entrada de mensaje.
 * - TextInput multilinea (máx 4 líneas)
 * - Botón enviar (deshabilitado si está vacío o enviando)
 * - Respeta safe area inferior (notch / home indicator)
 * - Integrado con validación de mensajes
 */

import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { ValidationState } from "@uniconnect/shared-types";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSpamStore } from "@/store/useSpamStore";

interface ChatInputTextState {
  value: string;
  onChangeText: (v: string) => void;
  onTyping: (v: string) => void;
}

interface ChatInputReplyState {
  preview: string | null;
  onClear: () => void;
}

interface ChatInputMediaState {
  previewUri: string | null;
  picking: boolean;
  onPick: () => void;
  onRemove: () => void;
}

interface ChatInputSendState {
  sending: boolean;
  onSend: () => void;
}

interface ChatInputVoiceState {
  recording: boolean;
  elapsedSec: number;
  onPress: () => void;
}

interface Props {
  text: ChatInputTextState;
  reply: ChatInputReplyState;
  media: ChatInputMediaState;
  send: ChatInputSendState;
  voice: ChatInputVoiceState;
  validationState?: ValidationState;
  containerStyle?: ViewStyle;
  backgroundColorOverride?: string;
  borderTopColorOverride?: string;
  paddingBottomOverride?: number;
}

export function ChatInput({
  text,
  reply,
  media,
  send,
  voice,
  validationState,
  containerStyle,
  backgroundColorOverride,
  borderTopColorOverride,
  paddingBottomOverride,
}: Props) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { value, onChangeText, onTyping } = text;
  const { preview: replyPreview, onClear: onClearReply } = reply;
  const {
    previewUri: imagePreviewUri,
    picking: pickingImage,
    onPick: onPickImage,
    onRemove: onRemoveImage,
  } = media;
  const { sending, onSend } = send;
  const {
    recording: voiceRecording,
    elapsedSec: voiceElapsedSec,
    onPress: onVoicePress,
  } = voice;

  const { isBlocked, remainingTime, checkBlockStatus } = useSpamStore();

  useEffect(() => {
    checkBlockStatus();
    const interval = setInterval(() => {
      checkBlockStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, [checkBlockStatus]);

  const hasMedia = !!imagePreviewUri;
  const hasValidationError = validationState?.error;
  const hasWarning = validationState?.warnings && validationState.warnings.length > 0;
  const charCount = value.length;
  const isNearLimit = charCount > 4500;

  const canSend = (value.trim().length > 0 || hasMedia) && !sending && !hasValidationError && !isBlocked;
  const canQuickAction = !sending && !pickingImage && !isBlocked;

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
          backgroundColor: backgroundColorOverride ?? C.background,
          borderTopColor: borderTopColorOverride ?? "transparent",
          paddingBottom: paddingBottomOverride ?? Math.max(insets.bottom, 8),
        },
        containerStyle,
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

      {/* Validación */}
      {isBlocked && (
        <View style={[styles.blockedCard, { backgroundColor: C.error + '15', borderColor: C.error }]}>
          <Text style={styles.errorIcon}>🚫</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.blockedTitle, { color: C.error }]}>
              Chat suspendido temporalmente
            </Text>
            <Text style={[styles.blockedMessage, { color: C.textSecondary }]}>
              Has sido bloqueado por comportamiento de spam. Podrás enviar mensajes de nuevo en:{" "}
              <Text style={{ fontWeight: "700", color: C.error }}>
                {Math.floor(remainingTime / 60)}:
                {String(remainingTime % 60).padStart(2, "0")}
              </Text>
            </Text>
          </View>
        </View>
      )}

      {hasValidationError && (
        <View style={[styles.errorCard, { backgroundColor: C.error + '20', borderColor: C.error }]}>
          <Text style={[styles.errorIcon]}>⚠️</Text>
          <Text style={[styles.errorMessage, { color: C.error }]}>
            {validationState?.error?.message || 'Error de validación'}
          </Text>
        </View>
      )}

      {hasWarning && (
        <View style={[styles.warningCard, { backgroundColor: '#FFA500' + '20', borderColor: '#FFA500' }]}>
          <Text style={[styles.warningIcon]}>ℹ️</Text>
          <Text style={[styles.warningMessage, { color: '#FF9500' }]}>
            {validationState?.warnings?.[0]?.message || 'Advertencia'}
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <TouchableOpacity
          onPress={onPickImage}
          disabled={pickingImage || sending || isBlocked}
          style={[styles.attachBtn, { backgroundColor: C.surface, borderColor: C.border }]}
          activeOpacity={0.8}
        >
          {pickingImage ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <Text style={[styles.attachIcon, { color: C.primary }]}>+</Text>
          )}
        </TouchableOpacity>

        <View style={[styles.inputShell, { backgroundColor: C.surface, borderColor: hasValidationError ? C.error : isNearLimit ? '#FFA500' : C.border }]}>
          <TextInput
            value={value}
            onChangeText={(text) => {
              onChangeText(text)
              onTyping(text)
            }}
            placeholder={isBlocked ? "Chat suspendido por spam..." : hasMedia ? "Agrega un comentario opcional..." : "Escribe un mensaje..."}
            placeholderTextColor={C.textPlaceholder}
            multiline
            maxLength={5000}
            numberOfLines={4}
            editable={!isBlocked && !sending}
            style={[
              styles.input,
              {
                color: C.text,
              },
            ]}
            onSubmitEditing={canSend ? onSend : undefined}
            blurOnSubmit={false}
          />
          <Text style={[styles.charCounter, { color: isNearLimit || hasValidationError ? (hasValidationError ? C.error : '#FFA500') : C.textSecondary }]}>
            {charCount}/5000
          </Text>
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
    minWidth: 0,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 20,
  },
  charCounter: {
    fontSize: 11,
    marginRight: 8,
    marginBottom: 4,
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
  errorCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorMessage: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  warningCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    gap: 8,
  },
  warningIcon: {
    fontSize: 16,
  },
  warningMessage: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  blockedCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  blockedTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  blockedMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
});
