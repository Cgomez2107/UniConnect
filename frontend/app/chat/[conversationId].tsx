/**
 * app/chat/[conversationId].tsx
 * Hilo de chat 1:1 — US-011
 *
 * Lógica de datos → hooks/useChat.ts
 * Componentes     → components/chat/MessageBubble.tsx
 *                   components/chat/ChatInput.tsx
 */

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Colors } from "@/constants/Colors";
import { useMessaging } from "@/hooks/application/useMessaging";
import {
  uploadChatAudio as uploadChatAudioFile,
  uploadChatImage as uploadChatImageFile,
} from "@/lib/services/infrastructure/chatMediaUpload";
import { useAuthStore } from "@/store/useAuthStore";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Message } from "@/types";

interface SelectedImage {
  uri: string;
  mimeType: string;
  fileName: string;
}

interface DayDividerItem {
  type: "day";
  id: string;
  label: string;
}

interface MessageItem {
  type: "message";
  id: string;
  message: Message;
}

type ChatListItem = DayDividerItem | MessageItem;

function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return "Hoy";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Ayer";

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function uploadChatImage(userId: string, image: SelectedImage): Promise<string> {
  return uploadChatImageFile(userId, image);
}

async function uploadChatAudio(
  userId: string,
  audioUri: string,
  fileName?: string,
  mimeType = "audio/x-m4a",
): Promise<string> {
  return uploadChatAudioFile(userId, audioUri, fileName, mimeType);
}

function getMessagePreview(message?: Message | null): string {
  if (!message) return "Mensaje";

  const mediaType = message.media_type?.toLowerCase() ?? "";
  if (message.content?.trim()) return message.content.trim();
  if (mediaType.startsWith("audio")) return "🎤 Audio";
  if (message.media_url) return "📷 Foto";
  return "Mensaje";
}

export default function ChatScreen() {
  const { conversationId, otherUserName } = useLocalSearchParams<{
    conversationId: string;
    otherUserName?: string;
  }>();

  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const flatListRef = useRef<FlatList<Message>>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [voiceRecording, setVoiceRecording] = useState<Audio.Recording | null>(null);
  const [voiceRecordingActive, setVoiceRecordingActive] = useState(false);
  const [voiceElapsedSec, setVoiceElapsedSec] = useState(0);
  const [typing, setTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    messages,
    loading,
    error,
    getMessages,
    sendMessage,
    retryMessage,
  } = useMessaging();

  const conversationIdValue = typeof conversationId === "string" ? conversationId : "";

  const chatItems = useMemo<ChatListItem[]>(() => {
    const items: ChatListItem[] = [];
    let lastDayKey = "";

    for (const msg of messages) {
      const d = new Date(msg.created_at);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dayKey !== lastDayKey) {
        items.push({
          type: "day",
          id: `day-${dayKey}`,
          label: formatDayLabel(msg.created_at),
        });
        lastDayKey = dayKey;
      }

      items.push({
        type: "message",
        id: msg.id,
        message: msg,
      });
    }

    return items;
  }, [messages]);

  useEffect(() => {
    if (!conversationIdValue) return;
    getMessages(conversationIdValue).catch(() => undefined);
  }, [conversationIdValue, getMessages]);

  useEffect(() => {
    return () => {
      if (voiceRecording) {
        voiceRecording.stopAndUnloadAsync().catch(() => undefined);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [voiceRecording]);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });

    return () => {
      sub.remove();
    };
  }, []);

  const send = useCallback(async () => {
    if (!conversationIdValue || !user?.id) return;
    const content = inputText.trim();
    const hasImage = !!selectedImage;
    if ((!content && !hasImage) || sending) return;

    setSending(true);
    try {
      const replyPreview = replyingTo ? getMessagePreview(replyingTo) : undefined;

      if (selectedImage) {
        const mediaUrl = await uploadChatImage(user.id, selectedImage);
        await sendMessage(conversationIdValue, user.id, {
          content,
          media_url: mediaUrl,
          media_type: selectedImage.mimeType,
          media_filename: selectedImage.fileName,
          reply_to_message_id: replyingTo?.id,
          reply_preview: replyPreview,
        });
      } else {
        await sendMessage(conversationIdValue, user.id, {
          content,
          reply_to_message_id: replyingTo?.id,
          reply_preview: replyPreview,
        });
      }

      setInputText("");
      setSelectedImage(null);
      setReplyingTo(null);
      setTyping(false);
    } finally {
      setSending(false);
    }
  }, [conversationIdValue, user?.id, inputText, sending, selectedImage, sendMessage, replyingTo]);

  const startVoiceRecording = useCallback(async () => {
    if (sending || !user?.id || !conversationIdValue || voiceRecordingActive) return;

    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Debes habilitar permisos de microfono para enviar audios.");
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });

    const rec = new Audio.Recording();
    rec.setOnRecordingStatusUpdate((status) => {
      if (!status.isRecording) return;
      const ms = status.durationMillis ?? 0;
      setVoiceElapsedSec(Math.floor(ms / 1000));
    });
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();

    setVoiceRecording(rec);
    setVoiceElapsedSec(0);
    setVoiceRecordingActive(true);
  }, [conversationIdValue, sending, user?.id, voiceRecordingActive]);

  const stopVoiceRecordingAndSend = useCallback(async () => {
    if (!voiceRecording || !user?.id || !conversationIdValue || sending) return;

    setSending(true);
    try {
      await voiceRecording.stopAndUnloadAsync();
      const audioUri = voiceRecording.getURI();
      setVoiceRecording(null);
      setVoiceRecordingActive(false);
      setVoiceElapsedSec(0);

      if (!audioUri) {
        throw new Error("No se pudo capturar el audio grabado.");
      }

      const replyPreview = replyingTo ? getMessagePreview(replyingTo) : undefined;
      const mediaUrl = await uploadChatAudio(user.id, audioUri);

      await sendMessage(conversationIdValue, user.id, {
        content: inputText.trim(),
        media_url: mediaUrl,
        media_type: "audio/x-m4a",
        media_filename: `voice_${Date.now()}.m4a`,
        reply_to_message_id: replyingTo?.id,
        reply_preview: replyPreview,
      });

      setInputText("");
      setReplyingTo(null);
      setTyping(false);
    } finally {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      }).catch(() => undefined);
      setSending(false);
    }
  }, [conversationIdValue, inputText, replyingTo, sendMessage, sending, user?.id, voiceRecording]);

  const handleVoicePress = useCallback(async () => {
    try {
      if (voiceRecordingActive) {
        await stopVoiceRecordingAndSend();
        return;
      }

      await startVoiceRecording();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo procesar el audio.";
      Alert.alert("Audio", message);
    }
  }, [startVoiceRecording, stopVoiceRecordingAndSend, voiceRecordingActive]);

  const handleTyping = useCallback((text: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setTyping(text.trim().length > 0);

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1200);
  }, []);

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
  }, []);

  const handleRetry = useCallback(
    async (message: Message) => {
      await retryMessage(message.id);
    },
    [retryMessage],
  );

  const pickImage = useCallback(async () => {
    if (sending || pickingImage) return;

    setPickingImage(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Debes habilitar permisos de galeria para enviar fotos.");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as any,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? `chat_${Date.now()}.jpg`,
      });
    } finally {
      setPickingImage(false);
    }
  }, [pickingImage, sending]);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const displayName = otherUserName
    ? decodeURIComponent(otherUserName)
    : "Chat";

  function getInitials(name: string): string {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: C.primary,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
          <Text style={styles.headerAvatarText}>{getInitials(displayName)}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.headerSub}>{typing ? "Escribiendo..." : "Chat privado"}</Text>
        </View>
      </View>

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>⚠️</Text>
          <Text style={[styles.errorText, { color: C.textPrimary }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef as any}
          data={chatItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.type === "day") {
              return (
                <View style={styles.dayDividerWrap}>
                  <View style={[styles.dayDivider, { backgroundColor: C.surface }]}>
                    <Text style={[styles.dayDividerText, { color: C.textSecondary }]}>{item.label}</Text>
                  </View>
                </View>
              );
            }

            return (
              <MessageBubble
                message={item.message}
                isOwn={item.message.sender_id === user?.id}
                onReply={handleReply}
                onRetry={handleRetry}
                onOpenMedia={(url) => {
                  router.push({
                    pathname: "/viewer",
                    params: {
                      url,
                      title: "Imagen del chat",
                      fileName: "imagen-chat.jpg",
                      fileType: "jpg",
                    },
                  });
                }}
              />
            );
          }}
          contentContainerStyle={[
            styles.list,
            messages.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 44 }}>💬</Text>
              <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
                Aún no hay mensajes
              </Text>
              <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
                Saluda a {displayName.split(" ")[0]} para empezar a coordinar.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      {/* ── Input ───────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onTyping={handleTyping}
          onSend={send}
          onVoicePress={handleVoicePress}
          onPickImage={pickImage}
          onRemoveImage={removeImage}
          replyPreview={
            replyingTo ? getMessagePreview(replyingTo) : null
          }
          onClearReply={() => setReplyingTo(null)}
          imagePreviewUri={selectedImage?.uri ?? null}
          sending={sending}
          pickingImage={pickingImage}
          voiceRecording={voiceRecordingActive}
          voiceElapsedSec={voiceElapsedSec}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 22,
    color: "#fff",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },

  // Lista
  list: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  listEmpty: {
    flex: 1,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Error / loading
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  dayDividerWrap: {
    alignItems: "center",
    marginVertical: 8,
  },
  dayDivider: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    opacity: 0.9,
  },
  dayDividerText: {
    fontSize: 11,
    fontWeight: "600",
  },
});