import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import studyGroupsService from "@/lib/services/studyGroups.service";
import { supabase, uploadChatImageFile } from "@/lib/supabase";

export function GroupChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setMessages(msgs || []);
        setMembers(membersData || []);
        setGroupName(groupData?.title || "Chat del grupo");
      } catch (err) {
        console.error("Error loading group chat:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`group-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_group_messages",
          filter: `group_id=eq.${id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg || !newMsg.id) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id || m._tempId === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !id) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      _tempId: tempId,
      group_id: id,
      sender_id: user?.id,
      senderId: user?.id,
      content: text.trim(),
      created_at: new Date().toISOString(),
      clientStatus: "sending",
      sender: { full_name: user?.name || "Tú", avatar_url: user?.profileImage || null },
      reply_to_message_id: replyingTo?.id || null,
      reply_preview: replyingTo?.content || null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    const replyTo = replyingTo;
    setReplyingTo(null);

    try {
      const msg = await studyGroupsService.sendGroupMessage(id, text.trim(), {
        replyToMessageId: replyTo?.id || undefined,
      });
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
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, clientStatus: "failed" } : m))
      );
    }
  };

  const handleRetry = async (failedMsg: any) => {
    if (!id) return;
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

      const msg = await studyGroupsService.sendGroupMessage(id, file.name, {
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const memberNameMap = new Map(members.map((m) => [m.userId, m.fullName || "Usuario"]));

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
        <div className="flex-1">
          <h1 className="text-base font-bold text-neutral-900">{groupName}</h1>
          <p className="text-xs text-neutral-500">{members.length} miembros</p>
        </div>
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
                />
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
        <div className="px-4 py-2 bg-primary-50 border-t border-primary-200 flex items-center gap-2">
          <span className="text-xs text-primary-700 flex-1 truncate">
            Respondiendo a: {replyingTo.content}
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-primary-500 hover:text-primary-700 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="bg-white border-t border-neutral-200 p-4">
        <div className="flex gap-2 items-end">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-2.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
            title="Subir imagen"
          >
            {uploadingImage ? (
              <span className="inline-block w-5 h-5 border-2 border-neutral-300 border-t-primary-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5-5m0 0l5 5m-5-5v12" />
              </svg>
            )}
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
          />
          <Button type="submit" loading={sending} disabled={!text.trim()}>
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
}

export default GroupChatPage;
