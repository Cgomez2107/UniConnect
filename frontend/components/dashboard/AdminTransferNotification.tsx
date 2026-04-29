/**
 * components/dashboard/AdminTransferNotification.tsx
 * 
 * Notificación emergente cuando un usuario es invitado a ser administrador.
 * Muestra: "Has sido invitado a ser administrador"
 * Con botones: Aceptar | Rechazar
 */

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api/httpClient";
import { useAuthStore } from "@/store/useAuthStore";

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
  const userId = useAuthStore((s) => s.user?.id);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Cargar transferencias pendientes
  useEffect(() => {
    if (!userId || !requestId || isDismissed) return;

    const loadTransfer = async () => {
      try {
        // Buscar transferencias pendientes para este usuario en este grupo
        const response = await fetchApi<any[]>(
          `/study-groups/${requestId}/admin-transfers?to_user_id=${userId}&status=pending`,
          { method: "GET" }
        );

        if (response && response.length > 0) {
          const transfer = response[0];
          setPendingTransfer({
            id: transfer.id,
            from_user_id: transfer.from_user_id,
            from_user_name: transfer.from_user_name || "Un administrador",
            status: transfer.status,
          });
        }
      } catch (error) {
        console.error("Error loading pending transfer:", error);
      }
    };

    loadTransfer();
  }, [userId, requestId, isDismissed]);

  const handleAccept = async () => {
    if (!pendingTransfer) return;

    setIsAccepting(true);
    try {
      // Llamar RPC para aceptar la transferencia
      await fetchApi(`/study-groups/${requestId}/accept-admin-transfer`, {
        method: "POST",
        body: JSON.stringify({
          transfer_id: pendingTransfer.id,
          actor_user_id: userId,
        }),
      });

      setPendingTransfer(null);
      setIsDismissed(true);
      onAccepted?.();
    } catch (error) {
      console.error("Error accepting transfer:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = () => {
    setPendingTransfer(null);
    setIsDismissed(true);
    onDismissed?.();
  };

  if (!pendingTransfer) return null;

  return (
    <div className="fixed top-24 right-8 z-50 w-96 rounded-xl border border-secondary/40 bg-secondary/10 p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <span className="material-symbols-outlined text-secondary text-2xl flex-shrink-0 mt-1">
          admin_panel_settings
        </span>
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1">Has sido invitado a ser administrador</h3>
          <p className="text-sm text-zinc-300 mb-4">
            {pendingTransfer.from_user_name} te ha delegado la administración de este grupo de estudio.
          </p>

          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-2 bg-secondary text-on-secondary-container font-bold rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              onClick={handleAccept}
              disabled={isAccepting}
            >
              {isAccepting ? "Aceptando..." : "Aceptar"}
            </button>
            <button
              className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-300 font-bold rounded-lg text-sm hover:border-zinc-500 transition-colors disabled:opacity-50"
              onClick={handleReject}
              disabled={isAccepting}
            >
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
