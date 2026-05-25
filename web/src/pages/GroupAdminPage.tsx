import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { useProfileNames } from "@/hooks/useProfileNames";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MentionInput } from "@/components/chat/MentionInput";
import studyGroupsService from "@/lib/services/studyGroups.service";
import messagingService from "@/lib/services/messaging.service";
import { getStorageService, uploadChatImageFile } from "@/lib/supabase";
import { useGroupEventsObserver } from "@/hooks/useGroupEventsObserver";
import { useChatObserver } from "@/hooks/useChatObserver";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { snakeToCamel } from "@uniconnect/shared-api";
import type { MentionData, ReactionData } from "@/chat/models/IMessage";
import { GroupStateBadge } from "@/components/groups/GroupStateBadge";
import { getGroupPermissions } from "@/components/groups/useGroupPermissions";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import type { GroupState } from "@/types";

// Backend: [{ userId, name }] → UI: [{ userId, displayName, position }]
function transformMentions(mentions?: any[]): MentionData[] | undefined {
  if (!mentions || mentions.length === 0) return undefined;
  return mentions.map((m) => ({
    userId: m.userId ?? m.user_id ?? "",
    displayName: m.name ?? m.displayName ?? "",
    position: 0,
  }));
}

// Backend: [{ emoji, userId }] (individual) → UI: [{ emoji, count, users: [id1, id2] }] (aggregated)
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

type AppTab = "pendiente" | "aceptada" | "rechazada";
type RightTab = "postulaciones" | "miembros" | "info";

export function GroupDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // --- Group data ---
  const [solicitud, setSolicitud] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("pendiente");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("miembros");

  // --- Transfer modal ---
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // --- Leave modal ---
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  // --- Session modal ---
  const [showSessionModal, setShowSessionModal] = useState(false);

  // --- Accept transfer ---
  const [acceptTransferLoading, setAcceptTransferLoading] = useState(false);
  const [acceptTransferError, setAcceptTransferError] = useState<string | null>(null);
  const [acceptTransferSuccess, setAcceptTransferSuccess] = useState(false);
  const pendingTransferId = searchParams.get("acceptTransfer");

  // --- Role detection (set after data loads) ---
  const [isMember, setIsMember] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  // --- Chat state ---
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // --- Load all data ---
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [data, membersData, msgs] = await Promise.all([
          studyGroupsService.getStudyGroupById(id),
          studyGroupsService.getStudyGroupMembers(id),
          studyGroupsService.getGroupMessages(id),
        ]);
        if (cancelled) return;
        setSolicitud(data);
        setMembers(membersData);
        setMessages((msgs || []).reverse());
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || "Error al cargar datos del grupo.");
        }
      } finally {
        if (!cancelled) { setLoading(false); setChatLoading(false); }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  const isAuthor = solicitud?.createdBy === user?.id || solicitud?.authorId === user?.id;
  const isAdmin = isAuthor || members.some((m: any) => m.userId === user?.id && (m.role === "admin" || m.role === "autor"));

  const groupState: GroupState | null = solicitud
    ? solicitud.status === "cerrada"
      ? "Disuelto"
      : solicitud.status === "expirada"
        ? "Bloqueado"
        : solicitud.hasPendingTransfer
          ? solicitud.pendingTransferStatus === "aceptada"
            ? "TransferenciaAceptada"
            : "PendienteTransferencia"
          : "Activo"
    : null;

  const perms = groupState ? getGroupPermissions(groupState) : null;

  // --- Conditional applications fetch (admin only) ---
  useEffect(() => {
    if (!id || !isAdmin) {
      setApplications([]);
      return;
    }

    let cancelled = false;
    setApplicationsLoading(true);

    studyGroupsService.getStudyGroupApplications(id)
      .then((apps) => { if (!cancelled) setApplications(apps); })
      .catch(() => { if (!cancelled) setApplications([]); })
      .finally(() => { if (!cancelled) setApplicationsLoading(false); });

    return () => { cancelled = true; };
  }, [id, isAdmin]);

  // --- Role detection & guest redirect ---
  useEffect(() => {
    if (!loading && solicitud) {
      const author = solicitud?.createdBy === user?.id || solicitud?.authorId === user?.id;
      const memberOf = members.some((m: any) => m.userId === user?.id) || author;
      setIsMember(memberOf);
      setRoleChecked(true);
    }
  }, [loading, solicitud, members, user?.id]);

  useEffect(() => {
    if (roleChecked && !isMember && !loading) {
      navigate(`/solicitud/${id}`, { replace: true });
    }
  }, [roleChecked, isMember, loading, id, navigate]);

  // --- Accept transfer handler ---
  const handleAcceptTransfer = useCallback(async () => {
    if (!pendingTransferId) return;
    setAcceptTransferLoading(true);
    setAcceptTransferError(null);
    setAcceptTransferSuccess(false);
    try {
      await studyGroupsService.acceptAdminTransfer(pendingTransferId);
      setAcceptTransferSuccess(true);
      const [data, membersData, appsData] = await Promise.all([
        studyGroupsService.getStudyGroupById(id!),
        studyGroupsService.getStudyGroupMembers(id!),
        studyGroupsService.getStudyGroupApplications(id!),
      ]);
      setSolicitud(data);
      setMembers(membersData);
      setApplications(appsData);
      navigate(`/grupo/${id}`, { replace: true });
    } catch (err: any) {
      setAcceptTransferError(err?.response?.data?.message || "Error al aceptar la transferencia.");
    } finally {
      setAcceptTransferLoading(false);
    }
  }, [pendingTransferId, id, navigate]);

  // --- Realtime chat subscription ---
  useChatObserver(id ?? null, (newMsg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id || m._tempId === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  });

  // --- Gateway WS real-time connection ---
  useEffect(() => {
    if (!id) return;

    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;
    let attempt = 0;

    const connect = (token: string) => {
      if (!mounted) return;
      attempt++;
      const url = `ws://localhost:3000/ws?token=${token}`;
      console.log(`[GroupDashboardPage WS] Connecting (attempt ${attempt})...`);
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (!mounted) { ws?.close(); return; }
        console.log(`[GroupDashboardPage WS] Connected, subscribing to group ${id}`);
        ws?.send(JSON.stringify({ type: "subscribe", groupId: id }));
        attempt = 0;
      };

      ws.onmessage = (event) => {
        if (!mounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.event === "new_group_message" && data.payload) {
            const newMsg = snakeToCamel(data.payload);
            if (!newMsg.sender) {
              newMsg.sender = {};
            }
            newMsg.sender.fullName = newMsg.sender.fullName || newMsg.senderFullName;
            newMsg.sender.full_name = newMsg.sender.full_name || newMsg.senderFullName;
            newMsg.mentions = transformMentions(newMsg.mentions);
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id || m._tempId === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }

          if (data.event === "reaction_updated" && data.payload) {
            const { messageId, reactions } = data.payload;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId || m._tempId === messageId
                  ? { ...m, reactions }
                  : m
              )
            );
          }
        } catch (err) {
          console.error("[GroupDashboardPage WS] Error parsing message:", err);
        }
      };

      ws.onclose = () => {
        if (!mounted) return;
        console.log(`[GroupDashboardPage WS] Disconnected, reconnecting in 3s...`);
        reconnectTimer = setTimeout(() => {
          const token = useAuthStore.getState().accessToken;
          if (token) connect(token);
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error("[GroupDashboardPage WS] Error:", err);
      };
    };

    const tryConnect = () => {
      if (!mounted) return;
      const token = useAuthStore.getState().accessToken;
      if (token) {
        connect(token);
      } else {
        console.log("[GroupDashboardPage WS] Waiting for token...");
        retryTimer = setTimeout(tryConnect, 500);
      }
    };

    tryConnect();

    return () => {
      mounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [id]);

  // --- Realtime group events ---
  const { addNotification } = useNotificationStore();

  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;

  useGroupEventsObserver(id ?? null, {
    onNewApplication: (app) => {
      if (!isAdminRef.current) return;
      const name = app.user?.fullName || app.user?.full_name || "Alguien";
      addNotification({
        id: `toast-${Date.now()}`,
        userId: user?.id || "system",
        type: "studyGroupApplication",
        title: `Nueva solicitud de ${name}`,
        description: "",
        read: false,
        createdAt: new Date(),
        data: {},
      });
      studyGroupsService.getStudyGroupApplications(id!).then(setApplications).catch(() => {});
    },
    onApplicationAccepted: (app) => {
      if (!isAdminRef.current) return;
      const name = app.user?.fullName || app.user?.full_name || resolveName(app.userId || app.user_id, null);
      addNotification({
        id: `toast-${Date.now() + 1}`,
        userId: user?.id || "system",
        type: "studyGroupApplication",
        title: `${name} fue aceptado/a`,
        description: "",
        read: false,
        createdAt: new Date(),
        data: {},
      });
      Promise.all([
        studyGroupsService.getStudyGroupApplications(id!),
        studyGroupsService.getStudyGroupMembers(id!),
      ]).then(([apps, mbrs]) => {
        setApplications(apps);
        setMembers(mbrs);
      }).catch(() => {});
    },
    onApplicationRejected: (app) => {
      if (!isAdminRef.current) return;
      const name = app.user?.fullName || app.user?.full_name || resolveName(app.userId || app.user_id, null);
      addNotification({
        id: `toast-${Date.now() + 2}`,
        userId: user?.id || "system",
        type: "studyGroupApplication",
        title: `${name} fue rechazado/a`,
        description: "",
        read: false,
        createdAt: new Date(),
        data: {},
      });
      studyGroupsService.getStudyGroupApplications(id!).then(setApplications).catch(() => {});
    },
  });

  // --- Profile resolution ---
  const applicantIds = useMemo(
    () => applications.map((a: any) => a.userId || a.applicantId).filter(Boolean),
    [applications],
  );

  const memberIds = useMemo(
    () => members.filter((m: any) => !m.fullName && !m.user?.fullName).map((m: any) => m.userId),
    [members],
  );

  const profileNames = useProfileNames([...new Set([...applicantIds, ...memberIds])]);


  const getMemberName = useCallback((member: any) => {
    return member.fullName || member.user?.fullName || "Usuario";
  }, []);

  const getMemberAvatar = useCallback((member: any) => {
    return member.avatarUrl || member.user?.avatarUrl || null;
  }, []);

  const resolveName = useCallback(
    (userId: string, fallback: string | null): string => {
      if (fallback) return fallback;
      return profileNames.get(userId)?.fullName || "Usuario";
    },
    [profileNames],
  );

  const resolveAvatar = useCallback(
    (userId: string): string | null => {
      return profileNames.get(userId)?.avatarUrl || null;
    },
    [profileNames],
  );

  // --- Members ---
  const sortedMembers = useMemo(
    () =>
      [...members]
        .map((m: any) => ({
          ...m,
          fullName: getMemberName(m) || resolveName(m.userId, null),
          avatarUrl: getMemberAvatar(m) || resolveAvatar(m.userId),
        }))
        .sort((a: any, b: any) => {
          const order: Record<string, number> = { autor: 0, admin: 1, miembro: 2 };
          return (order[a.role] ?? 3) - (order[b.role] ?? 3);
        }),
    [members, resolveName, resolveAvatar, getMemberName, getMemberAvatar],
  );

  // --- Applications ---
  const tabLabels: Record<AppTab, string> = {
    pendiente: "Pendientes",
    aceptada: "Aceptadas",
    rechazada: "Rechazadas",
  };

  const filteredApps = useMemo(
    () =>
      applications
        .map((a: any) => ({
          ...a,
          applicantId: a.userId || a.applicantId,
          applicantName: resolveName(a.userId || a.applicantId, a.user?.fullName || null),
          applicantAvatar: a.user?.avatarUrl || resolveAvatar(a.userId || a.applicantId),
          message: a.message || "",
          createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
        }))
        .filter((a: any) => a.status === activeTab),
    [applications, activeTab, resolveName, resolveAvatar],
  );

  const handleReview = async (applicationId: string, status: "aceptada" | "rechazada") => {
    setReviewingId(applicationId);
    try {
      await studyGroupsService.reviewApplication(applicationId, status);
      const [updatedApps, updatedMembers] = await Promise.all([
        studyGroupsService.getStudyGroupApplications(id!),
        studyGroupsService.getStudyGroupMembers(id!),
      ]);
      setApplications(updatedApps);
      setMembers(updatedMembers);
    } catch (err: any) {
      setError(err?.response?.data?.message || `Error al ${status === "aceptada" ? "aceptar" : "rechazar"} la postulación.`);
    } finally {
      setReviewingId(null);
    }
  };

  const handlePrivateChat = async (targetUserId: string) => {
    try {
      const conversation = await messagingService.createConversation(targetUserId);
      navigate(`/chat/${conversation.id}`);
    } catch (err: any) {
      setError("Error al iniciar chat.");
    }
  };

  const handleRequestTransfer = useCallback(async () => {
    if (!id || !transferTargetId) return;
    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(false);
    try {
      await studyGroupsService.requestAdminTransfer(id, transferTargetId);
      setTransferSuccess(true);
      setTransferTargetId(null);
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferSuccess(false);
      }, 2000);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "";
      if (status === 422 && msg.toLowerCase().includes("transfer")) {
        setTransferError("Ya se ha solicitado una transferencia. Espera a que se complete.");
      } else {
        setTransferError(msg || "Error al solicitar la transferencia.");
      }
    } finally {
      setTransferLoading(false);
    }
  }, [id, transferTargetId]);

  const handleLeave = async () => {
    if (!id) return;
    setLeaveLoading(true);
    try {
      await studyGroupsService.leaveStudyGroup(id);
      navigate("/solicitudes");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al salir del grupo.");
    } finally {
      setLeaveLoading(false);
      setShowLeaveConfirm(false);
    }
  };

  const tabCounts = useMemo(() => {
    const counts: Record<AppTab, number> = { pendiente: 0, aceptada: 0, rechazada: 0 };
    applications.forEach((a: any) => {
      const key = a.status as AppTab;
      if (key in counts) counts[key]++;
    });
    return counts;
  }, [applications]);

  const availableRightTabs = useMemo<RightTab[]>(() => {
    const tabs: RightTab[] = ["miembros", "info"];
    if (isAdmin) tabs.unshift("postulaciones");
    return tabs;
  }, [isAdmin]);

  const rightTabLabels: Record<RightTab, string> = {
    postulaciones: "Postulaciones",
    miembros: "Miembros",
    info: "Info",
  };

  const rightTabIcons: Record<RightTab, ReactNode> = {
    postulaciones: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    miembros: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  // --- Chat handlers ---
  const memberNameMap = useMemo(
    () => new Map(members.map((m: any) => [m.userId, m.fullName || m.user?.fullName || "Usuario"])),
    [members],
  );

  const enhancedMessages = useMemo(
    () => messages.map((msg: any) => ({
      ...msg,
      id: msg.id || msg._tempId,
      conversationId: id || "",
      senderId: msg.sender_id || msg.senderId || "",
      senderName: msg.senderName || msg.sender_full_name || msg.sender?.full_name || msg.sender?.fullName || msg.senderFullName || memberNameMap.get(msg.sender_id || msg.senderId) || "Usuario",
      replyToMessageId: msg.reply_to_message_id || msg.replyToMessageId || null,
      replyPreview: msg.reply_preview || msg.replyPreview || null,
      clientStatus: msg.client_status || msg.clientStatus || "sent",
      mediaUrl: msg.media_url || msg.mediaUrl || null,
      mediaType: msg.media_type || msg.mediaType || null,
      mediaFilename: msg.media_filename || msg.mediaFilename || null,
      createdAt: msg.created_at || msg.createdAt || new Date().toISOString(),
      content: msg.content || "",
      mentions: transformMentions(msg.mentions),
      reactions: transformReactions(msg.reactions),
    })),
    [messages, id, memberNameMap],
  );

  const handleSend = async (content: string, mentions: { userId: string; name: string }[], options?: { mediaUrl?: string; mediaType?: string }) => {
    if (!content.trim() && !options?.mediaUrl) return;
    if (!id) return;

    const finalContent = content.trim() || "Archivo";
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      _tempId: tempId,
      group_id: id,
      sender_id: user?.id,
      senderId: user?.id,
      content: finalContent,
      created_at: new Date().toISOString(),
      clientStatus: "sending",
      sender: { full_name: user?.name || "Tú", avatar_url: user?.profileImage || null },
      reply_to_message_id: replyingTo?.id || null,
      reply_preview: replyingTo?.content || null,
      media_url: options?.mediaUrl || null,
      media_type: options?.mediaType || null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    const replyTo = replyingTo;
    setReplyingTo(null);

    try {
      setSending(true);
      const msg = await studyGroupsService.sendGroupMessage(id, finalContent, {
        replyToMessageId: replyTo?.id || undefined,
        mentions,
        mediaUrl: options?.mediaUrl,
        mediaType: options?.mediaType,
      });
      setMessages((prev) => {
        if (prev.some((m: any) => m.id === msg.id)) {
          return prev.filter((m: any) => m.id !== tempId);
        }
        return prev.map((m: any) =>
          m.id === tempId
            ? { ...m, ...msg, clientStatus: "sent", _tempId: undefined, mediaUrl: m.mediaUrl || m.media_url || (msg as any).mediaUrl || (msg as any).media_url }
            : m
        );
      });
    } catch {
      setMessages((prev) =>
        prev.map((m: any) => (m.id === tempId ? { ...m, clientStatus: "failed" } : m))
      );
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (failedMsg: any) => {
    if (!id) return;
    setMessages((prev) =>
      prev.map((m: any) => (m.id === failedMsg.id ? { ...m, clientStatus: "sending" } : m))
    );
    try {
      const msg = await studyGroupsService.sendGroupMessage(id, failedMsg.content, {
        replyToMessageId: failedMsg.reply_to_message_id || failedMsg.replyToMessageId || undefined,
      });
      setMessages((prev) => {
        if (prev.some((m: any) => m.id === msg.id)) {
          return prev.filter((m: any) => m.id !== failedMsg.id);
        }
        return prev.map((m: any) =>
          m.id === failedMsg.id ? { ...m, ...msg, clientStatus: "sent" } : m
        );
      });
    } catch {
      setMessages((prev) =>
        prev.map((m: any) => (m.id === failedMsg.id ? { ...m, clientStatus: "failed" } : m))
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

      const msg: any = await studyGroupsService.sendGroupMessage(id, file.name, {
        mediaUrl,
        mediaType: file.type,
      });
      setMessages((prev) => {
        if (prev.some((m: any) => m.id === msg.id)) {
          return prev.filter((m: any) => m.id !== tempId);
        }
        return prev.map((m: any) =>
          m.id === tempId
            ? { ...m, ...msg, clientStatus: "sent", _tempId: undefined, mediaUrl: m.mediaUrl || m.media_url || (msg as any).mediaUrl || (msg as any).media_url }
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
        if (prev.some((m: any) => m.id === msg.id)) {
          return prev.filter((m: any) => m.id !== tempId);
        }
        return prev.map((m: any) =>
          m.id === tempId
            ? { ...m, ...msg, clientStatus: "sent", _tempId: undefined, mediaUrl: m.mediaUrl || m.media_url || (msg as any).mediaUrl || (msg as any).media_url }
            : m
        );
      });
    } catch (err) {
      console.error("Error uploading image:", err);
      setMessages((prev) =>
        prev.map((m: any) => (m.id === tempId ? { ...m, clientStatus: "failed" } : m))
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadFile = async (file: File): Promise<{ url: string; type: string }> => {
    if (!id) throw new Error("No group ID");
    setUploadingFile(true);
    try {
      const storage = getStorageService();
      const result = await storage.uploadChatImage(id, file);
      if (!result?.url) throw new Error("Upload returned no URL");
      return { url: result.url, type: file.type };
    } finally {
      setUploadingFile(false);
    }
  };

  // --- Loading / Error states ---
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !solicitud) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 dark:text-error-400 mb-4">{error}</p>
          <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">Grupo no encontrado</p>
          <Button onClick={() => navigate("/solicitudes")}>Volver a solicitudes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-primary-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/solicitudes")}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
          </button>
          <Avatar name={solicitud.title || solicitud.name || "Grupo"} size="sm" className="!bg-secondary-500 !text-primary-900" />
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">{solicitud.title || solicitud.name || "Grupo de estudio"}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-white/60">{members.length} miembros</p>
              {groupState && <GroupStateBadge state={groupState} size="small" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMember && (
            <Button variant="primary" size="sm" onClick={() => setShowSessionModal(true)}>
              Programar sesiones
            </Button>
          )}
          {isAuthor && perms?.canTransfer && (
            <Button variant="secondary" size="sm" onClick={() => setShowTransferModal(true)}>
              Transferir admin
            </Button>
          )}
          {isAuthor && solicitud.hasPendingTransfer && !perms?.canTransfer && (
            <Button variant="secondary" size="sm" disabled>
              Transferencia solicitada
            </Button>
          )}
          {!perms?.isReadOnly && (
            <Button variant="danger" size="sm" onClick={() => setShowLeaveConfirm(true)} loading={leaveLoading}>
              Salir
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border-b border-error-200 dark:border-error-800 px-4 sm:px-6 py-2">
          <p className="text-error-600 dark:text-error-400 text-sm">{error}</p>
        </div>
      )}

      {acceptTransferError && (
        <div className="bg-error-50 dark:bg-error-900/20 border-b border-error-200 dark:border-error-800 px-4 sm:px-6 py-2">
          <p className="text-error-600 dark:text-error-400 text-sm">{acceptTransferError}</p>
        </div>
      )}
      {acceptTransferSuccess && (
        <div className="bg-success-50 dark:bg-success-900/20 border-b border-success-200 dark:border-success-800 px-4 sm:px-6 py-2">
          <p className="text-success-600 dark:text-success-400 text-sm">Transferencia aceptada correctamente.</p>
        </div>
      )}
      {pendingTransferId && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 px-4 sm:px-6 py-2 flex items-center justify-between">
          <p className="text-primary-700 dark:text-primary-300 text-sm">Tienes una transferencia de administración pendiente.</p>
          <Button variant="primary" size="sm" onClick={handleAcceptTransfer} loading={acceptTransferLoading}>
            Aceptar transferencia
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Chat Panel */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-neutral-200 dark:border-neutral-700">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {chatLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : enhancedMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-neutral-400 dark:text-neutral-500 text-sm">No hay mensajes en el grupo aún.</p>
              </div>
            ) : (
              enhancedMessages.map((msg: any, index: number) => (
                <div key={msg.id} className={msg.senderId !== user?.id ? "flex items-start gap-2" : ""}>
                  {msg.senderId !== user?.id && (
                    <Avatar name={msg.senderName} size="sm" className="mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {msg.senderId !== user?.id && (
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-0.5 ml-1">
                        {msg.senderName}
                      </p>
                    )}
                    <MessageBubble
                      message={msg}
                      currentUser={user}
                      previousSenderSame={index > 0 && enhancedMessages[index - 1].senderId === msg.senderId}
                      onRetry={handleRetry}
                      onReply={(m) => setReplyingTo(m)}
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
            uploadingFile={uploadingFile}
            sending={sending}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>

        {/* RIGHT: Tabbed panel (Postulaciones / Miembros / Info) */}
        <div className="w-96 xl:w-[420px] flex flex-col overflow-hidden bg-white dark:bg-neutral-800">
          {/* Right panel tabs */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-700 shrink-0">
            {availableRightTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-tight transition-colors ${
                  rightTab === tab
                    ? "text-primary-700 dark:text-primary-300 border-b-2 border-primary-600 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-900/10"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                }`}
              >
                {rightTabIcons[tab]}
                {rightTabLabels[tab]}
              </button>
            ))}
          </div>

          {/* Right panel content */}
          <div className="flex-1 overflow-y-auto">
            {/* POSTULACIONES */}
            {rightTab === "postulaciones" && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-primary-900 dark:text-white">
                    Postulaciones
                  </h2>
                  <div className="flex bg-neutral-100 dark:bg-neutral-700 p-0.5 rounded-lg">
                    {(["pendiente", "aceptada", "rechazada"] as AppTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-all ${
                          activeTab === tab
                            ? "bg-white dark:bg-neutral-600 text-primary-700 dark:text-white shadow-sm"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                        }`}
                      >
                        {tabLabels[tab]}
                        {tabCounts[tab] > 0 && (
                          <span className="ml-1 px-1 py-0.5 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 text-[9px]">
                            {tabCounts[tab]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredApps.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-neutral-400 dark:text-neutral-500 text-xs">
                      {activeTab === "pendiente"
                        ? "No hay postulaciones pendientes."
                        : activeTab === "aceptada"
                          ? "No hay postulaciones aprobadas."
                          : "No hay postulaciones rechazadas."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredApps.map((app: any) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-xl border border-neutral-200 dark:border-neutral-600"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={app.applicantName} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-primary-900 dark:text-white truncate">
                              {app.applicantName}
                            </p>
                            {app.message && (
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                                {app.message}
                              </p>
                            )}
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                              {new Date(app.createdAt).toLocaleDateString("es-CO", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handlePrivateChat(app.applicantId)}
                            className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
                            title="Enviar mensaje"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </button>
                          {app.status === "pendiente" && (
                            <>
                              <button
                                onClick={() => handleReview(app.id, "aceptada")}
                                disabled={reviewingId === app.id}
                                className="p-1.5 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50 transition-colors disabled:opacity-50"
                                title="Aceptar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReview(app.id, "rechazada")}
                                disabled={reviewingId === app.id}
                                className="p-1.5 rounded-lg bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400 hover:bg-error-200 dark:hover:bg-error-900/50 transition-colors disabled:opacity-50"
                                title="Rechazar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MIEMBROS */}
            {rightTab === "miembros" && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-primary-900 dark:text-white">Miembros</h2>
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {members.length}
                  </span>
                </div>

                {sortedMembers.length === 0 ? (
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm text-center py-8">
                    Sin miembros
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {sortedMembers.map((member: any) => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-700/30 border border-neutral-100 dark:border-neutral-600/50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={member.fullName || "Usuario"} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-primary-900 dark:text-white truncate">
                              {member.fullName || "Usuario"}
                              {member.userId === user?.id && (
                                <span className="text-neutral-400 dark:text-neutral-500 font-normal"> (tú)</span>
                              )}
                            </p>
                            <RoleBadge role={member.role} />
                          </div>
                        </div>
                        <button
                          onClick={() => handlePrivateChat(member.userId)}
                          className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors shrink-0"
                          title="Enviar mensaje"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INFO */}
            {rightTab === "info" && (
              <div className="p-4 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-primary-900 dark:text-white mb-2">Información del grupo</h2>
                  <div className="bg-neutral-50 dark:bg-neutral-700/30 rounded-lg p-3 space-y-2 border border-neutral-100 dark:border-neutral-600/50">
                    <div>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Nombre</p>
                      <p className="text-sm text-primary-900 dark:text-white font-medium">{solicitud.title || solicitud.name || "Sin nombre"}</p>
                    </div>
                    {solicitud.description && (
                      <div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Descripción</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{solicitud.description}</p>
                      </div>
                    )}
                    {solicitud.subject && (
                      <div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Materia</p>
                        <p className="text-sm text-primary-900 dark:text-white font-medium">{solicitud.subject}</p>
                      </div>
                    )}
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Miembros</p>
                        <p className="text-sm text-primary-900 dark:text-white font-medium">{members.length} / {solicitud.maxMembers || "∞"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Postulaciones</p>
                        <p className="text-sm text-primary-900 dark:text-white font-medium">{applications.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-primary-900 dark:text-white mb-2">Acciones de administración</h2>
                  <div className="space-y-2">
                    {isAuthor && (
                      solicitud.hasPendingTransfer ? (
                        <Button
                          variant="secondary"
                          className="w-full justify-center"
                          disabled
                        >
                          Transferencia solicitada
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className="w-full justify-center"
                          onClick={() => setShowTransferModal(true)}
                        >
                          Transferir administración
                        </Button>
                      )
                    )}
                    <Button
                      variant="danger"
                      className="w-full justify-center"
                      onClick={() => setShowLeaveConfirm(true)}
                    >
                      Salir del grupo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave confirmation modal */}
      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title={isAuthor ? "Transferir administración" : "Salir del grupo"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLeaveConfirm(false)}>
              Cancelar
            </Button>
            {isAuthor ? (
              <Button variant="primary" onClick={() => { setShowLeaveConfirm(false); setShowTransferModal(true); }}>
                Transferir admin
              </Button>
            ) : (
              <Button variant="danger" onClick={handleLeave} loading={leaveLoading}>
                Salir
              </Button>
            )}
          </>
        }
      >
        {isAuthor ? (
          <div>
            <p className="text-neutral-600 dark:text-neutral-300 mb-3">
              Como creador del grupo, no puedes salir sin antes transferir la administración a otro miembro.
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              Usa "Transferir admin" para seleccionar quién tomará el control del grupo.
            </p>
          </div>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-300">
            ¿Estás seguro de que deseas salir de este grupo de estudio?
          </p>
        )}
      </Modal>

      {/* Transfer admin modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => { setShowTransferModal(false); setTransferError(null); setTransferSuccess(false); setTransferTargetId(null); }}
        title="Transferir administración"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowTransferModal(false); setTransferError(null); setTransferTargetId(null); }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleRequestTransfer}
              loading={transferLoading}
              disabled={!transferTargetId || transferSuccess}
            >
              {transferSuccess ? "Transferida" : "Transferir"}
            </Button>
          </>
        }
      >
        {transferSuccess ? (
          <p className="text-success-600 dark:text-success-400">
            Solicitud de transferencia enviada.
          </p>
        ) : (
          <>
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">
              Selecciona el miembro al que deseas transferir la administración.
            </p>
            {transferError && (
              <p className="text-error-600 dark:text-error-400 text-sm mb-3">{transferError}</p>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sortedMembers
                .filter((m: any) => m.role !== "autor" && m.userId !== user?.id)
                .map((member: any) => (
                  <button
                    key={member.userId}
                    onClick={() => setTransferTargetId(member.userId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      transferTargetId === member.userId
                        ? "bg-primary-50 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700"
                        : "bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <Avatar name={member.fullName || "Usuario"} size="sm" />
                    <span className="font-medium text-primary-900 dark:text-white text-sm">
                      {member.fullName || "Usuario"}
                    </span>
                  </button>
                ))}
              {sortedMembers.filter((m: any) => m.role !== "autor" && m.userId !== user?.id).length === 0 && (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm text-center py-4">
                  No hay otros miembros para transferir.
                </p>
              )}
            </div>
          </>
        )}
      </Modal>

      <CreateSessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onCreated={() => navigate(`/calendario-estudio?groupId=${id}`)}
        preselectedGroupId={id}
      />
    </div>
  );
}

export default GroupDashboardPage;
