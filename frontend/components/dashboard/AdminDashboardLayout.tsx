/**
 * components/dashboard/AdminDashboardLayout.tsx
 * 
 * Panel de administración de grupos de estudio con diseño premium.
 * Reconstrucción integral con todas las funcionalidades de gestión.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStudyGroupDashboard } from "@/hooks/useStudyGroupDashboard";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import { useMessaging } from "@/hooks/application/useMessaging";
import type { StudyGroupMember, GroupMessage } from "@/types/adminDashboard";
import { fetchApi } from "@/lib/api/httpClient";
import { supabase } from "@/lib/supabase";

const ROLE_LABELS: Record<StudyGroupMember["role"], string> = {
  autor: "Creador",
  admin: "Admin",
  miembro: "Miembro",
};

interface AdminDashboardLayoutProps {
  requestId?: string;
}

export function AdminDashboardLayout({ requestId }: AdminDashboardLayoutProps) {
  // --- AUTH & HOOK DATA ---
  const { user } = useAuthStore();
  const userId = user?.id ?? "";
  
  const {
    activeRequest,
    activeRequestId,
    applications,
    members,
    messages,
    stats,
    loading,
    error,
    sendingMessage,
    handleSendMessage,
    requestAdminTransfer,
    handleReviewApplication,
    updateDescription,
  } = useStudyGroupDashboard({ requestId });

  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState<"pendientes" | "aceptadas" | "rechazadas">("pendientes");
  const [newMessage, setNewMessage] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [transferMode, setTransferMode] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [hasPendingTransfer, setHasPendingTransfer] = useState(false);
  const [loadingTransferCheck, setLoadingTransferCheck] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDelegateWarning, setShowDelegateWarning] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [startingChat, setStartingChat] = useState(false);
  
  const router = useRouter();
  const { getOrCreateConversation } = useMessaging();
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- DERIVED STATE ---
  const isAdmin = useMemo(() => {
    const member = members.find(m => m.userId === userId);
    return member?.role === 'admin' || member?.role === 'autor';
  }, [members, userId]);

  const isCreator = useMemo(() => {
    return activeRequest?.author_id === userId;
  }, [activeRequest?.author_id, userId]);

  const isOnlyAdmin = useMemo(() => {
    const adminCount = members.filter(m => m.role === 'admin' || m.role === 'autor').length;
    // IMPORTANTE: El Creador (autor) SIEMPRE debe delegar antes de salir para transferir la propiedad,
    // incluso si existen otros administradores, de lo contrario el backend rechazará la salida directa.
    if (isCreator) return true;
    return adminCount <= 1;
  }, [members, isCreator]);

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      if (activeTab === "pendientes") return app.status === "pendiente";
      if (activeTab === "aceptadas") return app.status === "aceptada";
      return app.status === "rechazada";
    });
  }, [applications, activeTab]);

  // --- HANDLERS ---
  const handleSend = () => {
    if (!newMessage.trim() || sendingMessage) return;
    handleSendMessage(newMessage);
    setNewMessage("");
  };

  const handleLeaveDirectly = async () => {
    if (!requestId) return;
    setLeavingGroup(true);
    try {
      await fetchApi(`/study-groups/${requestId}/leave`, { method: "POST" });
      window.location.reload();
    } catch (err: any) {
      console.error("Error leaving group:", err);
      // Opcional: Podríamos mostrar un mensaje de error visual aquí
    } finally {
      setLeavingGroup(false);
    }
  };

  const handlePrivateChat = async (targetUserId: string) => {
    if (targetUserId === userId || startingChat) return;
    setStartingChat(true);
    try {
      const conversation = await getOrCreateConversation(userId, targetUserId);
      router.push(`/chat/${conversation.id}` as any);
    } catch (err) {
      console.error("Error starting chat:", err);
    } finally {
      setStartingChat(false);
    }
  };

  const checkPendingTransfers = React.useCallback(async () => {
    if (!userId || !activeRequestId) {
      setLoadingTransferCheck(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("study_request_admin_transfers")
        .select("id")
        .eq("request_id", activeRequestId)
        .eq("from_user_id", userId)
        .eq("status", "pendiente")
        .maybeSingle();
      
      setHasPendingTransfer(!!data);
    } catch (err) {
      console.error("Error checking transfers:", err);
      setHasPendingTransfer(false);
    } finally {
      setLoadingTransferCheck(false);
    }
  }, [userId, activeRequestId]);

  // --- EFFECTS ---
  useEffect(() => {
    if (activeRequest?.description) setDescDraft(activeRequest.description);
  }, [activeRequest?.description]);

  useEffect(() => {
    checkPendingTransfers();
  }, [checkPendingTransfers]);

  useEffect(() => {
    if (!activeRequestId || !userId) return;

    const channel = supabase.channel(`presence_${activeRequestId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const activeIds = Object.values(newState)
          .flat()
          .map((p: any) => p.user_id)
          .filter(Boolean);
        setOnlineUsers(activeIds);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [activeRequestId, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // --- RENDER HELPERS ---
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1A1A1A]">
        <div className="w-12 h-12 border-4 border-[#0047AB]/20 border-t-[#0047AB] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[#1A1A1A] text-white overflow-hidden font-['Inter']">
      
      {/* COLUMNA IZQUIERDA: Chat Grupal (65%) */}
      <div className="w-[65%] flex flex-col border-r border-[#2D2D2D] relative">
        <div className="p-6 bg-[#1A1A1A]/80 backdrop-blur-md border-b border-[#2D2D2D] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black font-['Manrope'] tracking-tight">Chat Grupal</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0047AB] animate-pulse" />
              <p className="text-[10px] text-[#0047AB] font-bold uppercase tracking-wider">
                {members.length} MIEMBROS ACTIVOS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button className="text-neutral-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">search</span>
             </button>
             <button className="text-neutral-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
             </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === userId ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  {msg.senderFullName || "Integrante"}
                </span>
                <span className="text-[9px] text-neutral-700">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.senderId === userId 
                  ? "bg-[#0047AB] text-white rounded-tr-none shadow-lg shadow-blue-900/20" 
                  : "bg-[#2D2D2D] text-neutral-200 rounded-tl-none border border-white/5"
              }`}>
                {msg.content}
                {msg.senderId === userId && (
                   <span className="material-symbols-outlined text-[12px] ml-2 align-middle opacity-50">done_all</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-[#1A1A1A] border-t border-[#2D2D2D]">
          <div className="flex items-center gap-4 bg-[#262626] p-4 rounded-2xl border border-white/5 focus-within:border-[#0047AB]/50 transition-all shadow-inner">
            <span className="material-symbols-outlined text-neutral-500">attach_file</span>
            <input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe un mensaje aquí..."
              className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 placeholder:text-neutral-600"
            />
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-neutral-500 hover:text-yellow-500 cursor-pointer">mood</span>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sendingMessage}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  newMessage.trim() && !sendingMessage
                    ? "bg-[#0047AB] text-white shadow-lg shadow-blue-900/40 scale-105"
                    : "bg-neutral-800 text-neutral-600"
                }`}
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: Gestión Administrativa (35%) */}
      <div className="w-[35%] flex flex-col bg-[#161616] overflow-y-auto custom-scrollbar border-l border-[#2D2D2D]">
        
        {/* BOTÓN SALIR (Alineado a la derecha) */}
        <div className="p-6 flex justify-end">
          <button 
            onClick={() => {
              if (loadingTransferCheck) return;
              if (hasPendingTransfer) return;
              if (transferMode) {
                setTransferMode(false);
                setSelectedCandidateId(null);
                return;
              }
              // Validación corregida: El Creador siempre debe delegar
              if (isOnlyAdmin) setShowDelegateWarning(true);
              else setShowLeaveConfirm(true);
            }}
            disabled={hasPendingTransfer || loadingTransferCheck || leavingGroup}
            className={`py-2.5 px-6 rounded-xl border flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all relative z-[9999] cursor-pointer ${
              hasPendingTransfer
                ? "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed"
                : "border-red-600 text-red-600 hover:bg-red-600 hover:text-white shadow-lg shadow-red-900/5"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {transferMode ? "close" : "logout"}
            </span>
            <span>
              {hasPendingTransfer 
                ? "Solicitud enviada" 
                : transferMode ? "Cancelar Salida" : "Salir del Grupo"}
            </span>
          </button>
        </div>

        {/* INFO GRUPO */}
        <div className="px-6 pb-8 border-b border-[#2D2D2D]">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#0047AB] mb-2 block">
            {activeRequest?.faculty_name || "FACULTAD DE INTELIGENCIA ARTIFICIAL E INGENIERÍAS"}
          </span>
          <h1 className="text-3xl font-black font-['Manrope'] tracking-tighter text-white mb-2 leading-none">
            {activeRequest?.title || "Cargando..."}
          </h1>
          <div className="flex items-center gap-3 mb-6">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-[12px] text-neutral-400">menu_book</span>
                <span className="text-[10px] font-bold text-neutral-300">{activeRequest?.subject_name || "General"}</span>
             </div>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-[12px] text-neutral-400">group</span>
                <span className="text-[10px] font-bold text-neutral-300">{members.length} / {activeRequest?.max_members || 0}</span>
             </div>
          </div>

          <div className="group relative bg-[#1E1E1E] rounded-2xl p-4 border border-white/5 hover:border-[#0047AB]/30 transition-all">
             <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Descripción</span>
                <button 
                  onClick={() => {
                    if (isEditingDesc) {
                       updateDescription(descDraft);
                       setIsEditingDesc(false);
                    } else {
                       setIsEditingDesc(true);
                    }
                  }}
                  className="text-[#0047AB] hover:text-blue-400 transition-colors"
                >
                   <span className="material-symbols-outlined text-sm">{isEditingDesc ? "check" : "edit_square"}</span>
                </button>
             </div>
             {isEditingDesc ? (
                <textarea 
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  className="w-full bg-[#161616] border-none rounded-xl text-sm text-neutral-300 p-3 min-h-[80px] focus:ring-1 focus:ring-[#0047AB]"
                />
             ) : (
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {activeRequest?.description || "Sin descripción disponible."}
                </p>
             )}
          </div>
        </div>

        {/* GESTIÓN DE SOLICITUDES */}
        <div className="p-6 border-b border-[#2D2D2D]">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <h3 className="text-xs font-black uppercase tracking-widest text-white">Solicitudes</h3>
                 <span className="px-2 py-0.5 bg-[#0047AB] text-white text-[9px] font-black rounded-full">
                    {stats?.pending || 0}
                 </span>
              </div>
              <div className="flex bg-[#1E1E1E] p-1 rounded-xl border border-white/5">
                 {(["pendientes", "aceptadas", "rechazadas"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                        activeTab === tab ? "bg-[#0047AB] text-white shadow-lg shadow-blue-900/20" : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                       {tab}
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-3 min-h-[100px]">
              {filteredApps.length > 0 ? filteredApps.map(app => (
                 <div key={app.id} className="p-4 bg-[#1E1E1E] rounded-2xl border border-white/5 flex items-center justify-between group animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center border border-white/5 overflow-hidden">
                          {app.profiles?.avatar_url ? <img src={app.profiles.avatar_url} className="w-full h-full object-cover" /> : <span className="text-xs font-black">{app.profiles?.full_name?.substring(0,1) || "?"}</span>}
                       </div>
                       <div>
                          <h4 className="text-[11px] font-black text-white">{app.profiles?.full_name || "Cargando..."}</h4>
                          <span className="text-[9px] text-neutral-500">{new Date(app.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handlePrivateChat(app.applicant_id)}
                         className="w-8 h-8 rounded-lg bg-white/5 text-neutral-500 hover:text-white transition-all flex items-center justify-center border border-white/5"
                       >
                          <span className="material-symbols-outlined text-sm">chat_bubble</span>
                       </button>
                       {app.status === "pendiente" && (
                          <>
                             <button 
                               onClick={() => handleReviewApplication(app.id, "aceptada")}
                               className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center border border-green-500/20"
                             >
                                <span className="material-symbols-outlined text-sm">check</span>
                             </button>
                             <button 
                               onClick={() => handleReviewApplication(app.id, "rechazada")}
                               className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/20"
                             >
                                <span className="material-symbols-outlined text-sm">close</span>
                             </button>
                          </>
                       )}
                    </div>
                 </div>
              )) : (
                 <div className="py-8 flex flex-col items-center justify-center opacity-30">
                    <span className="material-symbols-outlined text-3xl mb-2">inbox</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">Sin solicitudes</p>
                 </div>
              )}
           </div>
        </div>

        {/* LISTA DE INTEGRANTES */}
        <div className="p-6">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Integrantes del Grupo</h3>
              <span className="text-[10px] font-black text-neutral-700">{members.length} TOTAL</span>
           </div>

           <div className="space-y-4">
              {members.map(member => (
                 <div 
                    key={member.userId} 
                    className={`p-4 rounded-2xl border transition-all ${
                      selectedCandidateId === member.userId ? "bg-[#0047AB]/10 border-[#0047AB]" : "bg-[#1E1E1E] border-white/5"
                    }`}
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-neutral-800 border border-white/5 overflow-hidden shadow-inner">
                             {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-black">{member.fullName?.substring(0,1)}</div>}
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-neutral-200">{member.fullName || "Integrante"}</h4>
                             <div className="flex items-center gap-2 mt-0.5">
                               <span className={`text-[9px] font-black uppercase tracking-widest ${member.role === "autor" ? "text-yellow-500" : "text-neutral-500"}`}>
                                  {ROLE_LABELS[member.role]}
                               </span>
                               <span className="text-[8px] text-neutral-600">•</span>
                               <div className="flex items-center gap-1">
                                 <div className={`w-1.5 h-1.5 rounded-full ${onlineUsers.includes(member.userId) ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-neutral-600"}`} />
                                 <span className={`text-[9px] font-bold uppercase tracking-tight ${onlineUsers.includes(member.userId) ? "text-emerald-500" : "text-neutral-600"}`}>
                                   {onlineUsers.includes(member.userId) ? "Conectado" : "Desconectado"}
                                 </span>
                               </div>
                             </div>
                          </div>
                       </div>

                       <div className="flex gap-2">
                          {transferMode && member.userId !== userId ? (
                             <button
                                onClick={() => setSelectedCandidateId(member.userId)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                  selectedCandidateId === member.userId ? "bg-[#0047AB] text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"
                                }`}
                             >
                                {selectedCandidateId === member.userId ? "Elegido" : "Elegir"}
                             </button>
                          ) : (
                             <>
                                <button 
                                  onClick={() => handlePrivateChat(member.userId)}
                                  className={`w-9 h-9 rounded-xl bg-white/5 text-neutral-500 hover:text-white transition-all flex items-center justify-center border border-white/5 ${member.userId === userId ? "opacity-30 cursor-not-allowed" : "active:scale-90"}`}
                                  disabled={member.userId === userId}
                                >
                                   <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                </button>
                                <button className="w-9 h-9 rounded-xl bg-white/5 text-neutral-500 hover:text-white transition-all flex items-center justify-center border border-white/5">
                                   <span className="material-symbols-outlined text-sm">more_horiz</span>
                                </button>
                             </>
                          )}
                       </div>
                    </div>
                 </div>
              ))}
           </div>

           {transferMode && (
              <div className="mt-8 animate-in slide-in-from-bottom-4">
                 <button 
                   onClick={async () => {
                     if (selectedCandidateId) {
                        await requestAdminTransfer(selectedCandidateId);
                        setTransferMode(false);
                        setHasPendingTransfer(true);
                     }
                   }}
                   disabled={!selectedCandidateId}
                   className="w-full py-4 bg-[#0047AB] text-white font-black rounded-2xl hover:bg-[#00378B] shadow-xl shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-30"
                 >
                    CONFIRMAR Y SALIR
                 </button>
              </div>
           )}
        </div>
      </div>

      {/* MODALES DE ACCIÓN */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-6">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-[32px] p-10 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-black font-['Manrope'] text-white text-center mb-2">¿Abandonar grupo?</h3>
            <p className="text-neutral-500 text-center text-sm mb-8">Esta acción es permanente e inmediata.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleLeaveDirectly} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20">SÍ, SALIR</button>
              <button onClick={() => setShowLeaveConfirm(false)} className="w-full py-4 bg-transparent text-neutral-500 font-bold rounded-2xl hover:bg-white/5 transition-all">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {showDelegateWarning && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-6">
          <div className="bg-[#1A1A1A] border border-[#0047AB]/30 rounded-[32px] p-10 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-[#0047AB]/10 rounded-3xl flex items-center justify-center mb-6 mx-auto border border-[#0047AB]/20">
              <span className="material-symbols-outlined text-3xl text-[#0047AB]">shield_person</span>
            </div>
            <h3 className="text-2xl font-black font-['Manrope'] text-white text-center mb-2">Acción Requerida</h3>
            <p className="text-neutral-500 text-center text-sm leading-relaxed mb-10">Como único administrador, debes delegar el control antes de salir.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setShowDelegateWarning(false); setTransferMode(true); }} className="w-full py-4 bg-[#0047AB] text-white font-black rounded-2xl hover:bg-[#00378B] shadow-lg shadow-blue-900/30 transition-all">EMPEZAR DELEGACIÓN</button>
              <button onClick={() => setShowDelegateWarning(false)} className="w-full py-4 bg-transparent text-neutral-500 font-bold rounded-2xl hover:bg-white/5 transition-all">CERRAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
