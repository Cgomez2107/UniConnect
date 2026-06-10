import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MentionInput } from "@/components/chat/MentionInput";
import { Avatar } from "@/components/ui/Avatar";
import { GroupStateBadge } from "@/components/groups/GroupStateBadge";
import type { GroupState } from "@/types";
import studyGroupsService from "@/lib/services/studyGroups.service";
import { getStorageService, uploadChatImageFile } from "@/lib/supabase";
import { snakeToCamel } from "@uniconnect/shared-api";
import { useChatObserver } from "@/hooks/useChatObserver";
import { useAuthStore } from "@/store/useAuthStore";
import type { MentionData, ReactionData } from "@/chat/models/IMessage";
import { isForbiddenContent } from "@/hooks/useMessageValidation";
import { ValidationErrorCode, ValidationErrorMessages } from "@uniconnect/shared-types";
import { getWsUrl } from "@/lib/wsUrl";
import { apiClient } from "@/lib/api/client";

function transformMentions(mentions?: any[]): MentionData[] | undefined {
  if (!mentions || mentions.length === 0) return undefined;
  return mentions.map((m) => ({
    userId: m.userId ?? m.user_id ?? "",
    displayName: m.name ?? m.displayName ?? "",
    position: 0,
  }));
}

function transformReactions(reactions?: any[]): ReactionData[] | undefined {
  if (!reactions || reactions.length === 0) return undefined;
  const grouped = new Map<string, { emoji: string; users: string[] }>();
  for (const r of reactions) {
    const emoji = r.emoji;
    if (!emoji) continue;
    if (!grouped.has(emoji)) {
      grouped.set(emoji, { emoji, users: [] });
    }
    grouped.get(emoji)!.users.push(r.userId ?? r.user_id ?? "");
  }
  return Array.from(grouped.values()).map((g) => ({
    emoji: g.emoji,
    count: g.users.length,
    users: g.users,
  }));
}

export function GroupChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupState, setGroupState] = useState<GroupState>("Activo");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingTempIds = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [msgs, membersData, groupData] = await Promise.all([
          studyGroupsService.getGroupMessages(id),
          studyGroupsService.getStudyGroupMembers(id),
          studyGroupsService.getStudyGroupById(id),
        ]);
        if (cancelled) return;
        setMessages((msgs || []).reverse());
        setMembers(membersData || []);
        setGroupName(groupData?.name || "Chat del grupo");
        const groupStatus = (groupData as any)?.status as string;
        const hasPendingTransfer = !!(groupData as any)?.hasPendingTransfer;
        const computedState: GroupState = groupStatus === "cerrada"
          ? "Disuelto"
          : groupStatus === "expirada"
            ? "Bloqueado"
            : hasPendingTransfer
              ? "PendienteTransferencia"
              : "Activo";
        setGroupState(computedState);
      } catch (err) {
        console.error("Error loading group chat:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  // --- WebSocket para real-time (gateway) ---
  useEffect(() => {
    if (!id || !user?.id) {
      console.log("[GroupChat] WS effect skipped: id=", id, "user?.id=", user?.id);
      return;
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      console.log("[GroupChat] WS skipped: no access token");
      return;
    }

    console.log("[GroupChat] WS effect starting for group", id, "user", user?.id);

    const wsUrl = `${getWsUrl()}/ws?token=${token}`;
    let reconnectAttempts = 0;
    const MAX_RECONNECT = 3;

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[GroupChat] WS connected, subscribing to group", id);
        reconnectAttempts = 0;
        ws.send(JSON.stringify({ type: "subscribe", groupId: id }));
      };

      ws.onerror = (err) => {
        console.error("[GroupChat] WS error:", err);
      };

      ws.onclose = (event) => {
        console.log("[GroupChat] WS closed: code=", event.code, "reason=", event.reason, "wasClean=", event.wasClean);
        if (event.code !== 4001 && reconnectAttempts < MAX_RECONNECT) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 8000);
          console.log(`[GroupChat] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT})`);
          setTimeout(connect, delay);
        }
        wsRef.current = null;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const payload = data.payload || data;

          if (data.event === "new_group_message") {
            const mappedMsg = snakeToCamel(payload);
            console.log("[DEBUG] WS new_group_message:", JSON.stringify({ id: mappedMsg.id, hasPoll: !!mappedMsg.poll, pollKeys: mappedMsg.poll ? Object.keys(mappedMsg.poll) : null, content: mappedMsg.content }));
            mappedMsg.mentions = transformMentions(mappedMsg.mentions);
            mappedMsg.reactions = transformReactions(mappedMsg.reactions);
            if (pendingTempIds.current.size > 0 && pendingTempIds.current.has(mappedMsg.id)) return;
            setMessages((prev) => {
              if (prev.some((m) => m.id === mappedMsg.id || m._tempId === mappedMsg.id)) return prev;
              return [...prev, { ...mappedMsg, clientStatus: "sent" }];
            });
          }

          if (data.event === "reaction_updated") {
            const { messageId, reactions } = payload;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId || m._tempId === messageId
                  ? { ...m, reactions: transformReactions(reactions) }
                  : m
              )
            );
          }
        } catch {
          // ignore
        }
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        const ws = wsRef.current;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "unsubscribe", groupId: id }));
        }
        ws.close();
        wsRef.current = null;
      }
      reconnectAttempts = MAX_RECONNECT;
    };
  }, [id, user?.id]);

  // --- Supabase Realtime como fallback ---
  useChatObserver(id ?? null, (newMsg) => {
    const transformed = {
      ...newMsg,
      poll: newMsg.pollData ?? newMsg.poll ?? null,
      mentions: transformMentions(newMsg.mentions),
      reactions: transformReactions(newMsg.reactions),
    };
    setMessages((prev) => {
      if (prev.some((m) => m.id === transformed.id || m._tempId === transformed.id)) return prev;
      return [...prev, transformed];
    });
  });

  const handleUploadFile = async (file: File) => {
    const storage = getStorageService();
    let result;
    if (file.type.startsWith("image/")) {
      result = await storage.uploadChatImage(id!, file);
    } else {
      if (!user?.id) throw new Error("Debes iniciar sesión para subir archivos");
      result = await storage.uploadResource(user.id, file);
    }
    if (!result?.url) throw new Error("Error al subir archivo");
    return { url: result.url, type: file.type };
  };

  const handleSend = async (content: string, mentions: { userId: string; name: string }[], options?: { mediaUrl?: string; mediaType?: string; poll?: any }) => {
    if (!content.trim() || !id) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      _tempId: tempId,
      group_id: id,
      sender_id: user?.id,
      senderId: user?.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      clientStatus: "sending",
      sender: { full_name: user?.name || "Tú", avatar_url: user?.profileImage || null },
      reply_to_message_id: replyingTo?.id || null,
      reply_preview: replyingTo?.content || null,
      media_url: options?.mediaUrl || null,
      media_type: options?.mediaType || null,
      poll: options?.poll || null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    const replyTo = replyingTo;
    setReplyingTo(null);
    pendingTempIds.current.add(tempId);

    try {
      const msg = await studyGroupsService.sendGroupMessage(id, content.trim(), {
        replyToMessageId: replyTo?.id || undefined,
        mentions,
        mediaUrl: options?.mediaUrl,
        mediaType: options?.mediaType,
        poll: options?.poll,
      });
      pendingTempIds.current.delete(tempId);
      console.log("[DEBUG] sendMessage response:", JSON.stringify({ id: msg.id, hasPoll: !!msg.poll, pollKeys: msg.poll ? Object.keys(msg.poll) : null, content: msg.content }));
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) =>
          m.id === tempId
            ? { ...m, ...msg, clientStatus: "sent", _tempId: undefined }
            : m
        );
      });
    } catch (err) {
      pendingTempIds.current.delete(tempId);
      console.error("Error sending group message:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, clientStatus: "failed" } : m))
      );
      throw err;
    }
  };

  const handleRetry = async (failedMsg: any) => {
    if (!id) return;
    if (isForbiddenContent(failedMsg.content || "")) {
      alert(ValidationErrorMessages[ValidationErrorCode.BANNED_CONTENT]);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMsg.id ? { ...m, clientStatus: "failed" } : m
        )
      );
      return;
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === failedMsg.id ? { ...m, clientStatus: "sending" } : m))
    );
    try {
      const msg = await studyGroupsService.sendGroupMessage(id, failedMsg.content, {
        replyToMessageId: failedMsg.reply_to_message_id || failedMsg.replyToMessageId || undefined,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.filter((m) => m.id !== failedMsg.id);
        }
        return prev.map((m) =>
          m.id === failedMsg.id ? { ...m, ...msg, clientStatus: "sent" } : m
        );
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === failedMsg.id ? { ...m, clientStatus: "failed" } : m))
      );
    }
  };

  const handleVote = async (messageId: string, optionIndex: number) => {
    try {
      const response = await apiClient.post(
        `/study-groups/${id}/messages/${messageId}/polls/vote`,
        { optionIndex },
      );
      const data = response.data?.data || response.data;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, poll: data.poll ?? data.poll_data ?? data }
            : m,
        ),
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message;
      if (typeof msg === "string" && msg.toLowerCase().includes("cerrada")) {
        alert("Esta encuesta está cerrada");
      } else {
        console.error("Error al votar:", msg);
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setUploadingImage(true);
    try {
      const mediaUrl = await uploadChatImageFile(id, file);
      if (!mediaUrl) throw new Error("Error al subir imagen");

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        _tempId: tempId,
        group_id: id,
        sender_id: user?.id,
        senderId: user?.id,
        content: file.name,
        created_at: new Date().toISOString(),
        clientStatus: "sending",
        sender: { full_name: user?.name || "Tú", avatar_url: user?.profileImage || null },
        media_url: mediaUrl,
        media_type: file.type,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const msg: any = await studyGroupsService.sendGroupMessage(id, file.name, {
        mediaUrl,
        mediaType: file.type,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) =>
          m.id === tempId
            ? { ...m, ...msg, clientStatus: "sent", _tempId: undefined, media_url: m.media_url || msg.media_url }
            : m
        );
      });
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageSend = async (file: File) => {
    if (!id) return;
    setUploadingImage(true);
    let tempId = "";
    try {
      const mediaUrl = await uploadChatImageFile(id, file);
      if (!mediaUrl) throw new Error("Error al subir imagen");

      tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        _tempId: tempId,
        group_id: id,
        sender_id: user?.id,
        senderId: user?.id,
        content: file.name,
        created_at: new Date().toISOString(),
        clientStatus: "sending",
        sender: { full_name: user?.name || "Tú", avatar_url: user?.profileImage || null },
        media_url: mediaUrl,
        media_type: file.type,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const msg: any = await studyGroupsService.sendGroupMessage(id, file.name, {
        mediaUrl,
        mediaType: file.type,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) =>
          m.id === tempId
            ? { ...m, ...msg, clientStatus: "sent", _tempId: undefined, media_url: m.media_url || msg.media_url }
            : m
        );
      });
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const memberNameMap = new Map(members.map((m) => [m.userId, m.fullName || "Usuario"]));
  const voterMap = Object.fromEntries(memberNameMap);

  const enhancedMessages = messages.map((msg) => ({
    ...msg,
    id: msg.id || msg._tempId,
    senderId: msg.sender_id || msg.senderId || "",
    conversationId: id || "",
    senderName: msg.sender?.full_name || msg.sender?.fullName || memberNameMap.get(msg.sender_id || msg.senderId) || "Usuario",
    replyToMessageId: msg.reply_to_message_id || msg.replyToMessageId || null,
    replyPreview: msg.reply_preview || msg.replyPreview || null,
    clientStatus: msg.client_status || msg.clientStatus || "sent",
    mediaUrl: msg.media_url || msg.mediaUrl || null,
    mediaType: msg.media_type || msg.mediaType || null,
    mediaFilename: msg.media_filename || msg.mediaFilename || null,
    mentions: transformMentions(msg.mentions),
    reactions: transformReactions(msg.reactions),
  })) as any[];

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 text-sm">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(`/grupo/${id}`)}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
        </button>
        <Avatar name={groupName} size="sm" />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-neutral-900 truncate">{groupName}</h1>
          <p className="text-xs text-neutral-500">{members.length} miembros</p>
        </div>
        <GroupStateBadge state={groupState} size="small" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {enhancedMessages.length === 0 ? (
          <div className="text-center text-neutral-500 py-12">
            <p>No hay mensajes en el grupo aún.</p>
          </div>
        ) : (
          enhancedMessages.map((msg, index) => (
            <div key={msg.id} className={msg.senderId !== user?.id ? "flex items-start gap-2" : ""}>
              {msg.senderId !== user?.id && (
                <Avatar
                  name={msg.senderName}
                  size="sm"
                  className="mt-1 flex-shrink-0"
                />
              )}
              <div className="flex-1">
                {msg.senderId !== user?.id && (
                  <p className="text-[11px] text-neutral-400 mb-0.5 ml-1">
                    {msg.senderName}
                  </p>
                )}
                <MessageBubble
                  message={msg}
                  currentUser={user}
                  previousSenderSame={index > 0 && enhancedMessages[index - 1].senderId === msg.senderId}
                  onRetry={handleRetry}
                  onReply={(m) => setReplyingTo(m)}
                  onVote={handleVote}
                  voterMap={voterMap}
                  onToggleReaction={async (messageId, emoji) => {
                    try {
                      const result = await studyGroupsService.toggleReaction(id!, messageId, emoji);
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === messageId ? { ...m, reactions: result.reactions } : m
                        )
                      );
                    } catch (err: any) {
                      console.error("Error al reaccionar:", err?.response?.data?.message || err.message);
                    }
                  }}
                />
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MentionInput
        members={members}
        currentUserId={user?.id || ""}
        onSend={handleSend}
        onSendImage={handleImageSend}
        onUploadFile={handleUploadFile}
        uploadingImage={uploadingImage}
        sending={sending}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}

export default GroupChatPage;
