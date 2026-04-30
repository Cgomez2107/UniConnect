/**
 * components/dashboard/MemberChatView.tsx
 * 
 * Vista para miembros aceptados que NO son administradores.
 * Layout 60/40: Compañeros (izq) + Chat Grupal (der)
 * Funcionalidad: ver compañeros, chat privado, salir del grupo
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AdminTransferNotification } from "@/components/dashboard/AdminTransferNotification";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import { useMessaging } from "@/hooks/application/useMessaging";
import { useStudyGroupDashboard } from "@/hooks/useStudyGroupDashboard";
import { transformRawMessage } from "@/chat/utils/messageFactory";

interface MemberChatViewProps {
  requestId: string;
  groupTitle: string;
  groupSubtitle: string;
  groupDescription?: string;
  facultyName?: string;
  onLeaveGroup?: () => void;
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
  const {
    messages,
    members,
    loading: loadingData,
    sendingMessage,
    handleSendMessage,
    leaveGroup
  } = useStudyGroupDashboard({ requestId });

  const userId = useAuthStore((s) => s.user?.id ?? "");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);

  const router = useRouter();
  const { getOrCreateConversation } = useMessaging();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados para manejo de mensajes y menciones
  const [inputContent, setInputContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedMentions, setSelectedMentions] = useState<any[]>([]);

  // Filtrar compañeros (excluir al usuario actual)
  const companions = useMemo(() => 
    members.filter(m => m.userId !== userId), 
    [members, userId]
  );

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Salir del grupo
  const handleLeaveGroup = async () => {
    setLeavingGroup(true);
    try {
      await leaveGroup();
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

  // Iniciar chat privado
  const handleStartPrivateChat = async (targetUserId: string) => {
    if (targetUserId === userId || startingChat) return;
    setStartingChat(true);
    try {
      // US-W03: Obtener o crear la conversación privada antes de navegar
      const conversation = await getOrCreateConversation(userId, targetUserId);
      router.push(`/chat/${conversation.id}` as any);
    } catch (error) {
      console.error("Error starting private chat:", error);
    } finally {
      setStartingChat(false);
    }
  };

  // Manejo de entrada de texto y detección de menciones
  const handleInputChange = (text: string) => {
    setInputContent(text);
    
    // Detectar si el último carácter o palabra sugiere una mención
    const lastWord = text.split(" ").pop() || "";
    if (lastWord.startsWith("@")) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member: any) => {
    const words = inputContent.split(" ");
    words.pop(); // Eliminar el "@query" parcial
    const name = member.fullName || "Usuario";
    const newContent = [...words, `@${name} `].join(" ");
    
    setInputContent(newContent);
    setShowMentions(false);
    
    // Guardar metadata de la mención para el envío
    if (!selectedMentions.some(m => m.userId === member.userId)) {
      setSelectedMentions([...selectedMentions, { userId: member.userId, displayName: name }]);
    }
  };

  const handleSend = () => {
    if (!inputContent.trim()) return;
    
    // Filtrar solo las menciones que permanecen en el texto
    const finalMentions = selectedMentions.filter(m => 
      inputContent.includes(`@${m.displayName}`)
    );

    handleSendMessage(inputContent, finalMentions);
    setInputContent("");
    setSelectedMentions([]);
  };

  return (
    <div className="dark h-screen bg-[#1A1A1A] text-on-surface font-['Inter'] antialiased flex overflow-hidden">
      {/* ============================================================================ */}
      {/* LEFT COLUMN: Main Chat (70%) */}
      {/* ============================================================================ */}
      <div className="w-[70%] flex flex-col h-full border-r border-[#2D2D2D]">
        {/* Chat Header */}
        <div className="px-8 py-6 border-b border-[#2D2D2D] flex items-center justify-between flex-shrink-0 bg-[#1A1A1A]/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-['Manrope'] font-bold text-white">Chat Grupal</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0047AB] animate-pulse" />
              <p className="text-[10px] text-[#0047AB] font-bold uppercase tracking-wider">
                {members.length} MIEMBROS ACTIVOS
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
          {loadingData ? (
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
            <div className="flex flex-col gap-6">
              {messages.map((msg) => {
                const isOwnMessage = msg.senderId === userId;
                return (
                  <div key={msg.id} className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                        {msg.senderFullName || "Integrante"}
                      </span>
                      <span className="text-[9px] text-neutral-700">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {(() => {
                      const decoratedMessage = transformRawMessage(msg);
                      return (
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                          isOwnMessage 
                            ? "bg-[#0047AB] text-white rounded-tr-none shadow-lg shadow-blue-900/20" 
                            : "bg-[#2D2D2D] text-neutral-200 rounded-tl-none border border-white/5"
                        }`}>
                          {decoratedMessage.render({ currentUserId: userId })}
                          {isOwnMessage && (
                             <span className="material-symbols-outlined text-[12px] ml-2 align-middle opacity-50">done_all</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-6 border-t border-[#2D2D2D] bg-[#1A1A1A] relative">
          {/* Mention Suggestions Popover */}
          {showMentions && (
            <div className="absolute bottom-full left-6 mb-2 w-64 bg-[#2D2D2D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-bottom-2">
              <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Mencionar compañero</p>
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {members
                  .filter(m => (m.fullName || "").toLowerCase().includes(mentionQuery))
                  .map(member => (
                    <button
                      key={member.userId}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                      onClick={() => insertMention(member)}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0047AB] flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                        {(member.fullName || "??").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{member.fullName || "Integrante"}</p>
                        <p className="text-[10px] text-neutral-500">{member.role === 'admin' || member.role === 'autor' ? 'Administrador' : 'Estudiante'}</p>
                      </div>
                    </button>
                  ))}
                {members.filter(m => (m.fullName || "").toLowerCase().includes(mentionQuery)).length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-neutral-500 italic">No se encontraron miembros</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-[#2D2D2D]/50 border border-[#2D2D2D] rounded-2xl flex items-center p-2 focus-within:border-[#0047AB]/50 focus-within:bg-[#2D2D2D]/80 transition-all shadow-inner">
            <button className="p-3 text-neutral-500 hover:text-[#0047AB] transition-colors">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-white text-base px-4 placeholder:text-neutral-600 outline-none"
              placeholder="Escribe un mensaje aquí... (usa @ para mencionar)"
              type="text"
              value={inputContent}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                if (e.key === "Escape") {
                  setShowMentions(false);
                }
              }}
            />
            <div className="flex items-center gap-1">
              <button className="p-3 text-neutral-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">sentiment_satisfied</span>
              </button>
              <button
                className="bg-[#0047AB] text-white p-3 rounded-xl flex items-center justify-center hover:bg-[#003d91] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#0047AB]/20"
                disabled={sendingMessage || !inputContent.trim()}
                onClick={handleSend}
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================================ */}
      {/* RIGHT COLUMN: Info Panel (30%) */}
      {/* ============================================================================ */}
      <aside className="w-[30%] h-full overflow-y-auto p-8 flex flex-col gap-10 bg-[#1A1A1A] border-l border-[#2D2D2D] custom-scrollbar">
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
              {members.length} MIEMBROS
            </span>
          </div>

          <div className="space-y-3">
            {loadingData ? (
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
                            <img src={companion.avatarUrl} alt={companion.fullName ?? "Compañero"} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-neutral-500 font-bold text-xs">
                              {(companion.fullName ?? "?").split(" ").map(n => n[0]).join("")}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1A1A1A] ${online ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-neutral-600"}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{companion.fullName || "Integrante"}</p>
                        <p className="text-[10px] text-neutral-500 font-medium">{online ? "En línea" : "Desconectado"}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleStartPrivateChat(companion.userId)}
                      disabled={startingChat}
                      className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-[#0047AB] hover:bg-[#0047AB]/10 rounded-full transition-all active:scale-90"
                    >
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
