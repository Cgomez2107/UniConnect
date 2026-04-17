/**
 * components/chat/MessageBubble.tsx
 *
 * Burbuja de mensaje individual.
 * - Burbuja propia (derecha, color primario)
 * - Burbuja ajena (izquierda, gris)
 * - Timestamp
 * - Indicador de leído (✓✓ azul / ✓ gris)
 */

import { Colors } from "@/constants/Colors";
import type { Message } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Audio, type AVPlaybackStatus } from "expo-av";
import { memo, useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { Image } from "expo-image";

interface Props {
  message: Message;
  isOwn: boolean;
  onReply: (message: Message) => void;
  onRetry: (message: Message) => void;
  onOpenMedia: (url: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function getDeliveryTick(message: Message): string {
  if (message.client_status === "failed") return "!";
  if (message.client_status === "sending" || message.client_status === "retrying") return "⌛";
  return message.read_at ? "✓✓" : "✓";
}

function formatAudioTime(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(sec / 60);
  const secs = sec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getFileExtension(value?: string | null): string {
  if (!value) return "";
  return value.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
}

function isAudioMessage(message: Message): boolean {
  if (!message.media_url) return false;

  const mediaType = message.media_type?.toLowerCase() ?? "";
  if (mediaType.startsWith("audio/")) return true;

  const extByName = getFileExtension(message.media_filename ?? "");
  const extByUrl = getFileExtension(message.media_url);
  const audioExtensions = ["m4a", "aac", "mp3", "wav", "webm", "ogg", "mp4"];

  if (audioExtensions.includes(extByName) || audioExtensions.includes(extByUrl)) return true;

  // Algunos buckets retornan octet-stream aunque el archivo real sea audio.
  if (mediaType === "application/octet-stream") {
    return audioExtensions.includes(extByName) || audioExtensions.includes(extByUrl);
  }

  return false;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  onReply,
  onRetry,
  onOpenMedia,
}: Props) {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const hasAudio = isAudioMessage(message);
  const hasImage = Boolean(message.media_url) && !hasAudio;
  const hasText = message.content.trim().length > 0;
  const hasReply = Boolean(message.reply_preview);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosMs, setPlaybackPosMs] = useState(0);
  const [playbackDurMs, setPlaybackDurMs] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const progressPct = playbackDurMs > 0 ? Math.min(100, (playbackPosMs / playbackDurMs) * 100) : 0;

  const handleReply = useCallback(() => {
    onReply(message);
  }, [onReply, message]);

  const handleOpenImage = useCallback(() => {
    if (message.media_url) onOpenMedia(message.media_url);
  }, [message.media_url, onOpenMedia]);

  const handleRetry = useCallback(() => {
    onRetry(message);
  }, [onRetry, message]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => undefined);
      }
    };
  }, [sound]);

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status?.isLoaded) return;

    setIsPlaying(Boolean(status.isPlaying));
    setPlaybackPosMs(status.positionMillis ?? 0);
    setPlaybackDurMs(status.durationMillis ?? 0);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPlaybackPosMs(0);
    }
  }, []);

  const toggleAudio = useCallback(async () => {
    if (!message.media_url || audioLoading) return;

    setAudioLoading(true);
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          await sound.unloadAsync();
          setSound(null);
        } else if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
          return;
        } else {
          await sound.playAsync();
          setIsPlaying(true);
          return;
        }
      }

      const created = await Audio.Sound.createAsync(
        { uri: message.media_url },
        { shouldPlay: true },
        onPlaybackStatus,
      );
      setSound(created.sound);

      if (created.status.isLoaded) {
        setPlaybackDurMs(created.status.durationMillis ?? 0);
        setPlaybackPosMs(created.status.positionMillis ?? 0);
        setIsPlaying(Boolean(created.status.isPlaying));
      }
    } catch {
      Alert.alert("Audio", "No se pudo reproducir esta nota de voz.");
    } finally {
      setAudioLoading(false);
    }
  }, [audioLoading, message.media_url, onPlaybackStatus, sound]);

  return (
    <Pressable
      style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}
      onLongPress={handleReply}
      delayLongPress={180}
    >
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.bubbleOwn, { backgroundColor: C.primary }]
            : [styles.bubbleOther, { backgroundColor: C.surface, borderColor: C.border }],
        ]}
      >
        {hasReply && (
          <View style={[styles.replyChip, { borderColor: isOwn ? "rgba(255,255,255,0.4)" : C.border }]}>
            <Text
              style={[styles.replyText, { color: isOwn ? "rgba(255,255,255,0.92)" : C.textSecondary }]}
              numberOfLines={2}
            >
              {message.reply_preview}
            </Text>
          </View>
        )}

        {hasImage && (
          <Pressable
            onPress={handleOpenImage}
            style={styles.mediaWrap}
          >
            <Image source={{ uri: message.media_url ?? "" }} style={styles.mediaImage} contentFit="cover" />
            <Text style={[styles.mediaHint, { color: isOwn ? "rgba(255,255,255,0.8)" : C.textSecondary }]}>
              Toca para ampliar
            </Text>
          </Pressable>
        )}

        {hasAudio && (
          <View
            style={[
              styles.audioCard,
              {
                borderColor: isOwn ? "rgba(255,255,255,0.35)" : C.border,
                backgroundColor: isOwn ? "rgba(255,255,255,0.12)" : C.background,
              },
            ]}
          >
            <Pressable style={styles.audioRow} onPress={toggleAudio}>
              <View
                style={[
                  styles.audioPlayCircle,
                  {
                    backgroundColor: isOwn ? "rgba(255,255,255,0.2)" : C.primary,
                    borderColor: isOwn ? "rgba(255,255,255,0.25)" : C.primary,
                  },
                ]}
              >
                <Ionicons
                  name={audioLoading ? "hourglass" : isPlaying ? "pause" : "play"}
                  size={16}
                  color="#fff"
                />
              </View>

              <View style={styles.audioInfo}>
                <Text style={[styles.audioLabel, { color: isOwn ? "#fff" : C.textPrimary }]}>
                  {audioLoading ? "Cargando audio..." : isPlaying ? "Reproduciendo" : "Nota de voz"}
                </Text>
                <Text style={[styles.audioTime, { color: isOwn ? "rgba(255,255,255,0.82)" : C.textSecondary }]}>
                  {formatAudioTime(playbackPosMs)} / {formatAudioTime(playbackDurMs)}
                </Text>
              </View>
            </Pressable>

            <View style={[styles.audioProgressTrack, { backgroundColor: isOwn ? "rgba(255,255,255,0.22)" : C.border }]}>
              <View
                style={[
                  styles.audioProgressFill,
                  {
                    width: `${progressPct}%`,
                    backgroundColor: isOwn ? "#fff" : C.primary,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {hasText && (
          <Text
            style={[
              styles.content,
              { color: isOwn ? "#fff" : C.text },
            ]}
          >
            {message.content}
          </Text>
        )}

        {/* Meta: hora + estado de lectura */}
        <View style={styles.meta}>
          <Text style={[styles.time, { color: isOwn ? "rgba(255,255,255,0.7)" : C.textSecondary }]}>
            {formatTime(message.created_at)}
          </Text>
          {isOwn && (
            <Text
              style={[
                styles.readDot,
                {
                  color:
                    message.client_status === "failed"
                      ? "#ffb4b4"
                      : message.read_at
                        ? "#bfe1ff"
                        : "rgba(255,255,255,0.7)",
                },
              ]}
            >
              {getDeliveryTick(message)}
            </Text>
          )}
        </View>

        {isOwn && message.client_status === "failed" && (
          <Pressable
            onPress={handleRetry}
            style={[styles.retryBtn, { borderColor: C.error }]}
          >
            <Text style={[styles.retryText, { color: C.error }]}>Reintentar</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 3,
    paddingHorizontal: 12,
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  bubbleOwn: {
    borderBottomRightRadius: 3,
  },
  bubbleOther: {
    borderWidth: 1,
    borderBottomLeftRadius: 3,
  },
  replyChip: {
    borderLeftWidth: 2,
    borderRadius: 8,
    paddingLeft: 8,
    marginBottom: 6,
    paddingVertical: 4,
  },
  replyText: {
    fontSize: 12,
    lineHeight: 16,
  },

  content: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 2,
  },
  mediaWrap: {
    marginBottom: 4,
  },
  mediaImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  mediaHint: {
    marginTop: 5,
    fontSize: 11,
    textAlign: "right",
  },
  audioCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 4,
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  audioPlayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  audioInfo: {
    flex: 1,
  },
  audioLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  audioTime: {
    marginTop: 2,
    fontSize: 11,
  },
  audioProgressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 8,
  },
  audioProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  time: {
    fontSize: 10,
  },
  readDot: {
    fontSize: 10,
    fontWeight: "700",
  },
  retryBtn: {
    marginTop: 6,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
