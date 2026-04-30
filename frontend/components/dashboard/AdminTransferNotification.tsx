/**
 * components/dashboard/AdminTransferNotification.tsx
 * 
 * Notificación en tiempo real para transferencias de administración.
 * Escucha cambios en la tabla study_request_admin_transfers y muestra un banner premium.
 */

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api/httpClient";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";

interface AdminTransferNotificationProps {
  requestId: string;
  onAccepted?: () => void;
  onDismissed?: () => void;
}

interface PendingTransfer {
  id: string;
  from_user_id: string;
  from_user_name: string;
  status: string;
}

export function AdminTransferNotification({
  requestId,
  onAccepted,
  onDismissed,
}: AdminTransferNotificationProps) {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Cargar transferencias pendientes iniciales
  const loadInitialTransfer = React.useCallback(async () => {
    if (!userId || !requestId) return;

    try {
      const { data, error } = await supabase
        .from("study_request_admin_transfers")
        .select(`
          id,
          from_user_id,
          status,
          sender:from_user_id ( full_name )
        `)
        .eq("request_id", requestId)
        .eq("to_user_id", userId)
        .eq("status", "pendiente")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPendingTransfer({
          id: data.id,
          from_user_id: data.from_user_id,
          from_user_name: (data.sender as any)?.full_name || "Un administrador",
          status: data.status,
        });
      } else {
        setPendingTransfer(null);
      }
    } catch (err) {
      console.error("Error loading pending transfer:", err);
    }
  }, [userId, requestId]);

  useEffect(() => {
    loadInitialTransfer();
  }, [loadInitialTransfer]);

  // 2. Suscripción en tiempo real
  useEffect(() => {
    if (!userId || !requestId) return;

    // Nombre de canal único para esta instancia/sesión
    // Agregamos un sufijo aleatorio para evitar el error "cannot add callbacks after subscribe" 
    // que ocurre cuando React 19 (StrictMode) monta el componente dos veces muy rápido 
    // y Supabase intenta reutilizar el canal antes de que el anterior se haya cerrado.
    const instanceId = Math.random().toString(36).substring(7);
    const channelId = `admin-invites-${requestId}-${userId}-${instanceId}`;
    
    const channel = supabase.channel(channelId);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_request_admin_transfers",
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          const { eventType, new: newRecord } = payload;

          if (eventType === "INSERT" || eventType === "UPDATE") {
            if (newRecord.request_id === requestId && newRecord.status === "pendiente") {
              loadInitialTransfer();
            } else if (newRecord.status !== "pendiente") {
              setPendingTransfer(null);
            }
          } else if (eventType === "DELETE") {
            setPendingTransfer(null);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error:', channelId);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, requestId, loadInitialTransfer]);

  const handleAccept = async () => {
    if (!pendingTransfer || !userId) return;

    setIsProcessing(true);
    try {
      // Llamar al endpoint correcto del backend
      await fetchApi(`/study-groups/transfers/${pendingTransfer.id}/accept`, {
        method: "POST",
      });

      setPendingTransfer(null);
      onAccepted?.();
    } catch (error) {
      console.error("Error accepting transfer:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!pendingTransfer) return;

    setIsProcessing(true);
    try {
      // Actualizamos el estado directamente en Supabase (requiere RLS UPDATE)
      const { error } = await supabase
        .from("study_request_admin_transfers")
        .update({ status: "rechazada", responded_at: new Date().toISOString() })
        .eq("id", pendingTransfer.id);

      if (error) throw error;

      setPendingTransfer(null);
      onDismissed?.();
    } catch (error) {
      console.error("Error rejecting transfer:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!pendingTransfer) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-lg animate-in slide-in-from-top-4 duration-500">
      <div className="bg-[#0047AB] rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,71,171,0.4)] border border-white/20 backdrop-blur-md overflow-hidden relative group">
        {/* Efectos de fondo sutiles */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div className="flex items-start gap-5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 shadow-inner">
            <span className="material-symbols-outlined text-white text-2xl">admin_panel_settings</span>
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-black text-lg font-['Manrope'] tracking-tight mb-1">
              Invitación de Administración
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-5">
              <span className="font-bold text-white">{pendingTransfer.from_user_name}</span> desea delegarte el control total de este grupo. ¿Aceptas la responsabilidad?
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 px-6 py-3 bg-white text-[#0047AB] font-black rounded-xl text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                onClick={handleAccept}
                disabled={isProcessing}
              >
                {isProcessing ? "Procesando..." : "ACEPTAR CARGO"}
              </button>
              <button
                className="px-6 py-3 bg-[#00378B]/50 text-white font-bold rounded-xl text-xs uppercase tracking-widest border border-white/10 hover:bg-[#00378B] transition-all disabled:opacity-50"
                onClick={handleReject}
                disabled={isProcessing}
              >
                RECHAZAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
