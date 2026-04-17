import {
  uploadChatAudio as uploadChatAudioFile,
  uploadChatImage as uploadChatImageFile,
} from "@/lib/services/infrastructure/chatMediaUpload";
import type { CreateMessagePayload } from "@/lib/services/domain/repositories/IMessageRepository";
import type { Message } from "@/types";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

interface SelectedImage {
  uri: string;
  mimeType: string;
  fileName: string;
}

interface UseChatComposerParams {
  conversationId: string;
  userId?: string;
  sendMessage: (
    conversationId: string,
    senderId: string,
    payload: string | CreateMessagePayload,
  ) => Promise<unknown>;
  retryMessage: (tempId: string) => Promise<void>;
}

function getMessagePreview(message?: Message | null): string {
  if (!message) return "Mensaje";

  const mediaType = message.media_type?.toLowerCase() ?? "";
  if (message.content?.trim()) return message.content.trim();
  if (mediaType.startsWith("audio")) return "🎤 Audio";
  if (message.media_url) return "📷 Foto";
  return "Mensaje";
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

export function useChatComposer({
  conversationId,
  userId,
  sendMessage,
  retryMessage,
}: UseChatComposerParams) {
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

  const send = useCallback(async () => {
    if (!conversationId || !userId) return;

    const content = inputText.trim();
    const hasImage = !!selectedImage;
    if ((!content && !hasImage) || sending) return;

    setSending(true);
    try {
      const replyPreview = replyingTo ? getMessagePreview(replyingTo) : undefined;

      if (selectedImage) {
        const mediaUrl = await uploadChatImage(userId, selectedImage);
        await sendMessage(conversationId, userId, {
          content,
          media_url: mediaUrl,
          media_type: selectedImage.mimeType,
          media_filename: selectedImage.fileName,
          reply_to_message_id: replyingTo?.id,
          reply_preview: replyPreview,
        });
      } else {
        await sendMessage(conversationId, userId, {
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
  }, [conversationId, inputText, replyingTo, selectedImage, sendMessage, sending, userId]);

  const startVoiceRecording = useCallback(async () => {
    if (sending || !userId || !conversationId || voiceRecordingActive) return;

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
  }, [conversationId, sending, userId, voiceRecordingActive]);

  const stopVoiceRecordingAndSend = useCallback(async () => {
    if (!voiceRecording || !userId || !conversationId || sending) return;

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
      const mediaUrl = await uploadChatAudio(userId, audioUri);

      await sendMessage(conversationId, userId, {
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
  }, [conversationId, inputText, replyingTo, sendMessage, sending, userId, voiceRecording]);

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

  return {
    typing,
    replyingTo,
    setReplyingTo,
    handleReply,
    handleRetry,
    chatInputProps: {
      text: {
        value: inputText,
        onChangeText: setInputText,
        onTyping: handleTyping,
      },
      reply: {
        preview: replyingTo ? getMessagePreview(replyingTo) : null,
        onClear: () => setReplyingTo(null),
      },
      media: {
        previewUri: selectedImage?.uri ?? null,
        picking: pickingImage,
        onPick: pickImage,
        onRemove: removeImage,
      },
      send: {
        sending,
        onSend: send,
      },
      voice: {
        recording: voiceRecordingActive,
        elapsedSec: voiceElapsedSec,
        onPress: handleVoicePress,
      },
    },
  };
}
