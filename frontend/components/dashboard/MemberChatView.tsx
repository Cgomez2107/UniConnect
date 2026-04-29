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
      if (onLeaveGroup) {
        onLeaveGroup();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error leaving group:", error);
    } finally {
      setLeavingGroup(false);
    }
  };

  return (
    <div className="dark h-screen bg-[#1A1A1A] text-on-surface font-['Inter'] antialiased flex overflow-hidden">
      {/* Notificación flotante de transferencia de admin */}
      <AdminTransferNotification
        requestId={requestId}
        onAccepted={() => {
          window.location.reload();
        }}
      />

      {/* ============================================================================ */}
      {/* LEFT COLUMN: Main Chat (70%) */}
      {/* ============================================================================ */}
      <div className="w-[70%] flex flex-col h-full border-r border-[#2D2D2D]">
        {/* Chat Header */}
        <div className="px-8 py-6 border-b border-[#2D2D2D] flex items-center justify-between flex-shrink-0 bg-[#1A1A1A]/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-['Manrope'] font-bold text-white">Chat Grupal</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-[#0047AB] rounded-full animate-pulse"></span>
              <p className="text-[#0047AB] text-xs font-bold uppercase tracking-widest">
                {companions.length + 1} Miembros en el grupo
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-[#2D2D2D] rounded-lg text-neutral-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button className="p-2 hover:bg-[#2D2D2D] rounded-lg text-neutral-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#1A1A1A]">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-neutral-500 text-sm font-medium">Cargando mensajes...</div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-[#2D2D2D]/30 p-10 rounded-3xl border border-[#2D2D2D]">
                <span className="material-symbols-outlined text-4xl text-neutral-600 mb-4">forum</span>
                <p className="text-white font-semibold">No hay mensajes aún</p>
                <p className="text-neutral-500 text-sm mt-1">Sé el primero en escribir a tus compañeros</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-6">
              {/* Scroll anchor at bottom (since we are using col-reverse for logic or just regular order) */}
              {/* Note: the messages state seems to be ordered from newest to oldest in handleSendMessage (prev => [new, ...prev]), 
                  but the initial load might be oldest to newest. Let's check logic. 
                  Actually, the original code used regular map. Let's keep regular order for simplicity or reverse if needed.
              */}
              <div ref={messagesEndRef} />
              
              {[...messages].reverse().map((msg) => {
                const isOwnMessage = msg.senderId === userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isOwnMessage && (
                      <div className="w-8 h-8 rounded-full bg-[#0047AB]/20 flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#0047AB]/30">
                        {msg.senderAvatarUrl ? (
                          <img
                            alt={msg.senderFullName ?? "Remitente"}
                            className="w-full h-full object-cover"
                            src={msg.senderAvatarUrl ?? undefined}
                          />
                        ) : (
                          <span className="text-[#0047AB] text-xs font-bold">
                            {(msg.senderFullName ?? "?")[0]}
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      className={`flex flex-col gap-1.5 max-w-[70%] ${
                        isOwnMessage ? "items-end" : "items-start"
                      }`}
                    >
                      {!isOwnMessage && (
                        <span className="text-xs font-bold text-neutral-400 ml-2">
                          {msg.senderFullName}
                        </span>
                      )}

                      <div
                        className={`px-5 py-3 rounded-2xl shadow-sm ${
                          isOwnMessage
                            ? "bg-[#0047AB] text-white rounded-br-none"
                            : "bg-[#2D2D2D] text-neutral-200 rounded-bl-none border border-[#3D3D3D]"
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed">{msg.content}</p>
                      </div>

                      <div className={`flex items-center gap-1.5 px-2 mt-0.5 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">
                          {new Date(msg.createdAt).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isOwnMessage && (
                          <span className="material-symbols-outlined text-[14px] text-[#0047AB]">done_all</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-[#2D2D2D] bg-[#1A1A1A]">
          <div className="bg-[#2D2D2D]/50 border border-[#2D2D2D] rounded-2xl flex items-center p-2 focus-within:border-[#0047AB]/50 focus-within:bg-[#2D2D2D]/80 transition-all shadow-inner">
            <button className="p-3 text-neutral-500 hover:text-[#0047AB] transition-colors">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-white text-base px-4 placeholder:text-neutral-600 outline-none"
              placeholder="Escribe un mensaje aquí..."
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
            <div className="flex items-center gap-1">
              <button className="p-3 text-neutral-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">sentiment_satisfied</span>
              </button>
              <button
                className="bg-[#0047AB] text-white p-3 rounded-xl flex items-center justify-center hover:bg-[#003d91] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#0047AB]/20"
                disabled={sendingMessage}
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                  handleSendMessage(input.value);
                  input.value = "";
                }}
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  send
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================================ */}
      {/* RIGHT COLUMN: Info Panel (30%) */}
      {/* ============================================================================ */}
      <aside className="w-[30%] h-full overflow-y-auto p-8 flex flex-col gap-10 bg-[#1A1A1A] custom-scrollbar">
        {/* Leave Group Action */}
        <div className="flex-shrink-0">
          <button
            className="w-full py-3.5 px-6 text-sm font-bold rounded-xl border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-2 group"
            onClick={() => setShowLeaveConfirm(true)}
          >
            <span className="material-symbols-outlined text-lg group-hover:animate-pulse">logout</span>
            SALIR DEL GRUPO
          </button>
        </div>

        {/* Group Metadata */}
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[#0047AB] text-[10px] font-black uppercase tracking-[0.2em]">
              {facultyName || "Facultad de Ingeniería"}
            </p>
            <h1 className="text-3xl font-['Manrope'] font-extrabold text-white leading-tight">
              {groupTitle}
            </h1>
            <p className="text-neutral-400 font-medium text-sm">
              {groupSubtitle}
            </p>
          </div>
          
          <div className="pt-4 border-t border-[#2D2D2D]">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Descripción</h4>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {groupDescription || "Este grupo no tiene una descripción detallada todavía."}
            </p>
          </div>
        </section>

        {/* Community Section: Compañeros */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-['Manrope'] font-bold text-white">Compañeros</h3>
            <span className="px-2.5 py-1 bg-[#0047AB]/10 text-[#0047AB] rounded-full text-[10px] font-black tracking-tighter">
              {companions.length} MIEMBROS
            </span>
          </div>

          <div className="space-y-3">
            {loadingCompanions ? (
              <div className="py-4 flex justify-center">
                <div className="w-5 h-5 border-2 border-[#0047AB] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : companions.length === 0 ? (
              <p className="text-neutral-600 text-xs text-center py-4 bg-[#2D2D2D]/20 rounded-xl border border-dashed border-[#2D2D2D]">
                No hay otros compañeros aún
              </p>
            ) : (
              companions.map((companion) => {
                const online = isUserOnline(companion.joinedAt);
                return (
                  <div
                    key={companion.userId}
                    className="flex items-center justify-between p-3.5 bg-[#2D2D2D]/30 border border-[#2D2D2D]/50 rounded-2xl hover:bg-[#2D2D2D]/50 hover:border-[#3D3D3D] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center border border-[#3D3D3D] overflow-hidden">
                          {companion.avatarUrl ? (
                            <img src={companion.avatarUrl ?? undefined} alt={companion.fullName ?? "Compañero"} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-neutral-500 font-bold text-xs">
                              {(companion.fullName ?? "?").split(" ").map(n => n[0]).join("")}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1A1A1A] ${online ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-neutral-600"}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{companion.fullName}</p>
                        <p className="text-[10px] text-neutral-500 font-medium">{online ? "En línea" : "Desconectado"}</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-[#0047AB] hover:bg-[#0047AB]/10 rounded-full transition-all">
                      <span className="material-symbols-outlined text-xl">chat_bubble</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Library Section: Recursos */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-['Manrope'] font-bold text-white">Recursos</h3>
            <button className="text-[10px] font-black text-[#0047AB] uppercase tracking-wider hover:underline">VER TODO</button>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-[#2D2D2D]/30 border border-[#2D2D2D]/50 rounded-2xl flex items-center gap-4 hover:bg-[#2D2D2D]/50 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Guía_Estudio_U1.pdf</p>
                <p className="text-[10px] text-neutral-500 font-medium">1.4 MB • Hace 2 días</p>
              </div>
              <span className="material-symbols-outlined text-neutral-600 group-hover:text-white transition-colors">download</span>
            </div>

            <div className="p-4 bg-[#2D2D2D]/30 border border-[#2D2D2D]/50 rounded-2xl flex items-center gap-4 hover:bg-[#2D2D2D]/50 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-[#0047AB]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#0047AB]">description</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Notas_Clase_Semana5.docx</p>
                <p className="text-[10px] text-neutral-500 font-medium">856 KB • Ayer</p>
              </div>
              <span className="material-symbols-outlined text-neutral-600 group-hover:text-white transition-colors">download</span>
            </div>
          </div>
        </section>
      </aside>

      {/* Confirmación para salir (Modal) */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
            </div>
            <h3 className="text-2xl font-['Manrope'] font-bold text-white text-center mb-2">¿Salir del grupo?</h3>
            <p className="text-neutral-400 text-center text-sm leading-relaxed mb-8">
              Esta acción eliminará tu acceso al chat y recursos de <span className="text-white font-bold">"{groupTitle}"</span>. Podrás volver a postularte si hay cupos disponibles.
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-red-600/20"
                onClick={handleLeaveGroup}
                disabled={leavingGroup}
              >
                {leavingGroup ? "Saliendo..." : "Sí, salir del grupo"}
              </button>
              <button
                className="w-full py-4 bg-transparent text-neutral-400 font-bold rounded-2xl hover:bg-[#2D2D2D] transition-all"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Notificación de transferencia de administración */}
      <AdminTransferNotification 
        requestId={requestId} 
        onAccepted={() => {
          // Si acepta ser admin, forzamos recarga de la página para que StudyGroupDetailScreen
          // lo detecte como admin y muestre el AdminDashboardLayout
          window.location.reload();
        }}
      />
    </div>
  );
}
