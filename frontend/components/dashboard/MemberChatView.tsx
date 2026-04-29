/**
 * components/dashboard/MemberChatView.tsx
 * 
 * Vista para miembros aceptados que NO son administradores.
 * Layout 60/40: Compañeros (izq) + Chat Grupal (der)
 * Funcionalidad: ver compañeros, chat privado, salir del grupo
 */

import React, { useEffect, useRef, useState } from "react";
import { GroupChatPanel } from "@/components/dashboard/GroupChatPanel";
import { AdminTransferNotification } from "@/components/dashboard/AdminTransferNotification";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchApi } from "@/lib/api/httpClient";
import type { GroupMessage, StudyGroupMember } from "@/types/adminDashboard";

interface MemberChatViewProps {
  requestId: string;
  groupTitle: string;
  groupSubtitle: string;
  groupDescription?: string;
  facultyName?: string;
  onLeaveGroup?: () => void;
}

// Mapeo de propiedades snake_case a camelCase para mensajes de API
function mapApiMessageToDomain(msg: any): GroupMessage {
  return {
    id: msg.id,
    requestId: msg.request_id || msg.requestId,
    senderId: msg.sender_id || msg.senderId,
    content: msg.content,
    createdAt: msg.created_at || msg.createdAt,
    senderFullName: msg.sender_full_name || msg.senderFullName,
    senderAvatarUrl: msg.sender_avatar_url || msg.senderAvatarUrl,
  };
}

// Determinar si un miembro está online basado en última conexión
function isUserOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const lastDate = new Date(lastSeen).getTime();
  const now = new Date().getTime();
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  return lastDate > fiveMinutesAgo;
}

export function MemberChatView({
  requestId,
  groupTitle,
  groupSubtitle,
  groupDescription = "",
  facultyName = "",
  onLeaveGroup,
}: MemberChatViewProps) {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const userAvatarUrl = useAuthStore((s) => s.user?.avatarUrl ?? "");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [companions, setCompanions] = useState<StudyGroupMember[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingCompanions, setLoadingCompanions] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesLoadedRef = useRef(false);
  const companionsLoadedRef = useRef(false);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar mensajes del grupo (solo una vez al montar)
  useEffect(() => {
    if (messagesLoadedRef.current) return;
    messagesLoadedRef.current = true;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await fetchApi<any[]>(
          `/study-groups/${requestId}/messages?limit=50&offset=0`,
          { method: "GET" }
        );
        setMessages((response || []).map(mapApiMessageToDomain));
      } catch (error) {
        console.error("Error loading chat messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
    // No hacer polling automático para evitar bucle infinito
  }, [requestId]);

  // Cargar compañeros del grupo (solo una vez al montar)
  useEffect(() => {
    if (companionsLoadedRef.current) return;
    companionsLoadedRef.current = true;

    const loadCompanions = async () => {
      try {
        setLoadingCompanions(true);
        const response = await fetchApi<any[]>(
          `/study-groups/${requestId}/members`,
          { method: "GET" }
        );
        if (response) {
          const members = response.map((m) => ({
            userId: m.user_id || m.userId,
            fullName: m.full_name || m.fullName,
            avatarUrl: m.avatar_url || m.avatarUrl,
            role: m.role || "miembro",
            joinedAt: m.joined_at || m.joinedAt,
          }));
          // Excluir al usuario actual
          setCompanions(members.filter((m) => m.userId !== userId));
        }
      } catch (error) {
        console.error("Error loading companions:", error);
      } finally {
        setLoadingCompanions(false);
      }
    };

    loadCompanions();
  }, [requestId, userId]);

  // Enviar mensaje
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetchApi<any>(
        `/study-groups/${requestId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        }
      );

      if (response) {
        setMessages((prev) => [mapApiMessageToDomain(response), ...prev]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Salir del grupo
  const handleLeaveGroup = async () => {
    setLeavingGroup(true);
    try {
      await fetchApi(`/study-groups/${requestId}/leave`, {
        method: "POST",
      });
      setShowLeaveConfirm(false);
      onLeaveGroup?.();
    } catch (error) {
      console.error("Error leaving group:", error);
    } finally {
      setLeavingGroup(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#121212] text-on-surface font-body-main antialiased">
      {/* Notificación flotante de transferencia de admin */}
      <AdminTransferNotification
        requestId={requestId}
        onAccepted={() => {
          window.location.reload();
        }}
      />

      {/* ============================================================================ */}
      {/* HERO SECTION */}
      {/* ============================================================================ */}
      <section className="bg-[#121212] border-b border-[#2D2D2D] px-10 py-12 sticky top-20 z-30">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-start justify-between gap-8 mb-6">
            <div className="flex-1">
              {/* Subject Badge */}
              {groupSubtitle && (
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-600/20 border border-blue-500/40 rounded-full">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest">
                    {groupSubtitle} {facultyName && `• ${facultyName}`}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl font-bold text-white mb-3 leading-tight tracking-tight">
                {groupTitle}
              </h1>

              {/* Description */}
              {groupDescription && (
                <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed">
                  {groupDescription}
                </p>
              )}
            </div>

            {/* Action Button: Salir del Grupo */}
            <div className="flex-shrink-0">
              <button
                className="px-6 py-3 text-sm font-semibold rounded-xl border border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-500 transition-all"
                onClick={() => setShowLeaveConfirm(true)}
              >
                Salir del Grupo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmación para salir */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl p-8 max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Salir del grupo</h3>
            <p className="text-neutral-400 mb-6">
              ¿Estás seguro de que deseas salir de "{groupTitle}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 border border-[#2D2D2D] text-on-surface rounded-lg hover:bg-neutral-800 transition-all"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                onClick={handleLeaveGroup}
                disabled={leavingGroup}
              >
                {leavingGroup ? "Saliendo..." : "Sí, salir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* MAIN CONTENT: Two-Column Layout (60/40) */}
      {/* ============================================================================ */}
      <main className="px-10 py-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-12 gap-8 h-[calc(100vh-300px)]">
          {/* LEFT COLUMN: Compañeros (60%) */}
          <div className="col-span-12 lg:col-span-5 space-y-8 overflow-y-auto custom-scrollbar pr-4">
            {/* ===== COMPAÑEROS SECTION ===== */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Compañeros</h2>
                <span className="px-3 py-1 bg-neutral-900 text-neutral-400 rounded-full text-xs font-bold uppercase tracking-widest">
                  ONLINE
                </span>
              </div>

              <div className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl overflow-hidden">
                {companions.length === 0 && !loadingCompanions ? (
                  <div className="p-8 text-center text-neutral-500">
                    No hay compañeros en el grupo
                  </div>
                ) : (
                  <div className="divide-y divide-[#2D2D2D]">
                    {companions.map((companion) => {
                      const online = isUserOnline(companion.joinedAt);
                      return (
                        <div
                          key={companion.userId}
                          className="p-6 flex items-center justify-between hover:bg-neutral-900/50 transition-colors group"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Avatar con indicador online */}
                            <div className="relative flex-shrink-0">
                              {companion.avatarUrl ? (
                                <img
                                  alt={companion.fullName ?? "Compañero"}
                                  className="w-12 h-12 rounded-full object-cover"
                                  src={companion.avatarUrl}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 font-bold">
                                  {(companion.fullName ?? "?")
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")}
                                </div>
                              )}
                              {/* Dot online/offline */}
                              <div
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1E1E1E] ${
                                  online ? "bg-emerald-500" : "bg-neutral-600"
                                }`}
                              ></div>
                            </div>

                            {/* Name & Role */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-white">
                                  {companion.fullName ?? "Sin nombre"}
                                </span>
                                <span className="text-xs px-2 py-1 rounded font-bold uppercase tracking-widest bg-neutral-800 text-neutral-400">
                                  {companion.role === "autor"
                                    ? "Creador"
                                    : companion.role === "admin"
                                      ? "Admin"
                                      : "Miembro"}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1">
                                {online ? "En línea ahora" : "Desconectado"}
                              </p>
                            </div>
                          </div>

                          {/* Chat Button */}
                          <button className="p-2 text-neutral-500 hover:text-white transition-colors text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            💬
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ===== RECURSOS SECTION ===== */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Recursos Compartidos</h2>

              <div className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 hover:bg-neutral-900/50 rounded-lg transition-colors cursor-pointer group">
                  <div className="p-3 bg-blue-600/20 rounded-lg flex-shrink-0 group-hover:bg-blue-600/30 transition-colors">
                    <span className="material-symbols-outlined text-blue-400">description</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">Resumen_Paxos.pdf</p>
                    <p className="text-xs text-neutral-500 mt-1">2.4 MB • Compartido hace 2 horas</p>
                  </div>
                  <button className="material-symbols-outlined text-neutral-500 group-hover:text-white transition-colors flex-shrink-0">
                    download
                  </button>
                </div>

                <div className="flex items-start gap-4 p-4 hover:bg-neutral-900/50 rounded-lg transition-colors cursor-pointer group">
                  <div className="p-3 bg-emerald-600/20 rounded-lg flex-shrink-0 group-hover:bg-emerald-600/30 transition-colors">
                    <span className="material-symbols-outlined text-emerald-400">folder</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">Diagramas_Arquitectura</p>
                    <p className="text-xs text-neutral-500 mt-1">Carpeta • Actualizado ayer</p>
                  </div>
                  <button className="material-symbols-outlined text-neutral-500 group-hover:text-white transition-colors flex-shrink-0">
                    folder_open
                  </button>
                </div>

                <div className="flex items-start gap-4 p-4 hover:bg-neutral-900/50 rounded-lg transition-colors cursor-pointer group">
                  <div className="p-3 bg-purple-600/20 rounded-lg flex-shrink-0 group-hover:bg-purple-600/30 transition-colors">
                    <span className="material-symbols-outlined text-purple-400">note</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">Apuntes_Sesión_21_04</p>
                    <p className="text-xs text-neutral-500 mt-1">Documento • 1.2 MB</p>
                  </div>
                  <button className="material-symbols-outlined text-neutral-500 group-hover:text-white transition-colors flex-shrink-0">
                    open_in_new
                  </button>
                </div>
              </div>

              <button className="w-full mt-4 border border-[#2D2D2D] text-on-surface py-3 rounded-lg text-body-main font-semibold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2">
                Ver todos los recursos
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </section>
          </div>

          {/* RIGHT COLUMN: Chat Grupal (40%) */}
          <div className="col-span-12 lg:col-span-7 h-full sticky top-32">
            <section className="h-full flex flex-col bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl overflow-hidden shadow-xl">
              {/* Chat Header */}
              <div className="p-6 border-b border-[#2D2D2D] flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white">Chat Grupal</h2>
                  <p className="text-emerald-400 text-xs font-semibold mt-1 flex items-center">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                    {companions.length} COMPAÑEROS ACTIVOS
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">search</span>
                  </button>
                  <button className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0F0F0F]">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-neutral-500 text-sm">Cargando mensajes...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-neutral-500">
                      <p className="text-sm">No hay mensajes aún</p>
                      <p className="text-xs mt-1">Sé el primero en escribir</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Day Separator */}
                    <div className="flex items-center gap-4 py-4">
                      <div className="flex-1 h-px bg-[#2D2D2D]"></div>
                      <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        HOY
                      </span>
                      <div className="flex-1 h-px bg-[#2D2D2D]"></div>
                    </div>

                    {/* Messages */}
                    {messages.map((msg) => {
                      const isOwnMessage = msg.senderId === userId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-3 ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isOwnMessage && (
                            <img
                              alt={msg.senderFullName ?? "Remitente"}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              src={
                                msg.senderAvatarUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderFullName ?? "User")}`
                              }
                            />
                          )}

                          <div
                            className={`flex flex-col gap-2 max-w-xs ${
                              isOwnMessage ? "items-end" : "items-start"
                            }`}
                          >
                            {!isOwnMessage && (
                              <div className="flex items-center gap-2 px-3">
                                <span className="text-xs font-bold text-on-surface">
                                  {msg.senderFullName}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {new Date(msg.createdAt).toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}

                            <div
                              className={`px-5 py-3 rounded-2xl ${
                                isOwnMessage
                                  ? "bg-emerald-500 text-white rounded-br-none font-semibold"
                                  : "bg-[#2D2D2D] text-on-surface rounded-bl-none"
                              }`}
                            >
                              <p className="text-base leading-relaxed">{msg.content}</p>
                            </div>

                            {isOwnMessage && (
                              <span className="text-xs text-neutral-500 px-3 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">
                                  done_all
                                </span>
                                Leído
                              </span>
                            )}
                          </div>

                          {isOwnMessage && (
                            <img
                              alt="Tu perfil"
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              src={
                                userAvatarUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent("You")}`
                              }
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-[#2D2D2D] bg-[#1E1E1E]">
                <div className="bg-[#0F0F0F] border border-[#2D2D2D] rounded-xl flex items-center p-2 focus-within:border-on-surface transition-colors">
                  <button className="p-3 text-neutral-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">add_circle</span>
                  </button>
                  <input
                    className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface text-body-large px-4 placeholder:text-neutral-600 outline-none"
                    placeholder="Escribe un mensaje..."
                    type="text"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const input = e.currentTarget;
                        handleSendMessage(input.value);
                        input.value = "";
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button className="p-3 text-neutral-500 hover:text-white transition-colors">
                      <span className="material-symbols-outlined">mood</span>
                    </button>
                    <button
                      className="bg-white text-surface p-3 rounded-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                      disabled={sendingMessage}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        send
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Notificación de transferencia de admin - Mostrar en la parte superior */}
      <AdminTransferNotification
        requestId={requestId}
        onAccepted={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
