import { useMessaging } from "@/hooks/application/useMessaging";
import { useStudentProfile } from "@/hooks/application/useStudentProfile";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

export function useStudentProfileScreen(studentId: string) {
  const currentUser = useAuthStore((s) => s.user);
  const { getOrCreateConversation } = useMessaging();
  const [startingChat, setStartingChat] = useState(false);

  const { profile, loading, error, refresh } = useStudentProfile(studentId);

  const initials = useMemo(
    () =>
      (profile?.full_name ?? "UC")
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    [profile?.full_name],
  );

  const handleStartChat = useCallback(async () => {
    if (!currentUser?.id || !profile?.id) return;
    setStartingChat(true);
    try {
      const conversation = await getOrCreateConversation(currentUser.id, profile.id);
      router.push(`/chat/${conversation.id}` as any);
    } catch {
      Alert.alert("Error", "No se pudo iniciar la conversación.");
    } finally {
      setStartingChat(false);
    }
  }, [currentUser?.id, getOrCreateConversation, profile?.id]);

  return {
    profile,
    loading,
    error,
    refresh,
    initials,
    startingChat,
    handleStartChat,
  };
}
