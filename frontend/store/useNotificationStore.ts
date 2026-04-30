import { create } from "zustand";

export type NotificationType = 
  | "transferencia_admin_solicitada" 
  | "transferencia_admin_aceptada" 
  | "solicitud_ingreso" 
  | "miembro_aceptado"
  | "miembro_rechazado";

export interface NotificationData {
  id?: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: any;
}

interface NotificationState {
  queue: NotificationData[];
  processedIds: Set<string>;
  transferAccepted: boolean;

  // Actions
  pushNotification: (data: NotificationData) => void;
  popNotification: () => void;
  markTransferAccepted: (requestId: string) => void;
  resetTransferAccepted: () => void;
  clearQueue: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  queue: [],
  processedIds: new Set(),
  transferAccepted: false,

  pushNotification: (data) => set((state) => {
    // 1. Evitar duplicados por ID (Deduplicación absoluta)
    if (data.id && state.processedIds.has(data.id)) {
      return state;
    }

    // 2. Evitar que se encole si ya está en la cola actual
    if (data.id && state.queue.some(n => n.id === data.id)) {
      return state;
    }

    const newProcessed = new Set(state.processedIds);
    if (data.id) newProcessed.add(data.id);

    console.log("[NotificationStore] Nueva notificación encolada:", data.type, data.id);
    return { 
      queue: [...state.queue, data],
      processedIds: newProcessed
    };
  }),

  popNotification: () => set((state) => ({
    queue: state.queue.slice(1)
  })),

  clearQueue: () => set({ queue: [], processedIds: new Set() }),

  markTransferAccepted: (requestId) => {
    set({ transferAccepted: true });
  },

  resetTransferAccepted: () => set({ transferAccepted: false }),
}));
