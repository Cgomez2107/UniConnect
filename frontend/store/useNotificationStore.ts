import { create } from "zustand";

export type NotificationType = 
  | "transferencia_admin_solicitada" 
  | "transferencia_admin_aceptada" 
  | "transferencia_admin_rechazada"
  | "transferencia_admin_transferida"
  | "solicitud_ingreso" 
  | "miembro_aceptado"
  | "miembro_rechazado"
  | "admin_role_left"
  | "nuevo_evento"
  | "vote_received"
  | "answer_marked_as_solution"
  | "system";

export type Prioridad = "normal" | "urgente" | "critica";

export interface Accion {
  label: string;
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
}

export interface NotificationData {
  id?: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: any;
  priority?: Prioridad;
  action?: Accion;
}

interface NotificationState {
  queue: NotificationData[];
  processedIds: Set<string>;
  transferAccepted: boolean;
  unreadCount: number;

  // Actions
  pushNotification: (data: NotificationData) => void;
  popNotification: () => void;
  markTransferAccepted: (requestId: string) => void;
  resetTransferAccepted: () => void;
  clearQueue: () => void;
  incrementUnread: () => void;
  resetUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  queue: [],
  processedIds: new Set(),
  transferAccepted: false,
  unreadCount: 0,

  pushNotification: (data) => set((state) => {
    if (data.id && state.processedIds.has(data.id)) {
      return state;
    }

    if (data.id && state.queue.some(n => n.id === data.id)) {
      return state;
    }

    const newProcessed = new Set(state.processedIds);
    if (data.id) newProcessed.add(data.id);

    console.log("[NotificationStore] Nueva notificación encolada:", data.type, data.id);
    return { 
      queue: [...state.queue, data],
      processedIds: newProcessed,
      unreadCount: state.unreadCount + 1,
    };
  }),

  popNotification: () => set((state) => ({
    queue: state.queue.slice(1)
  })),

  clearQueue: () => set({ queue: [], processedIds: new Set(), unreadCount: 0 }),

  markTransferAccepted: (requestId) => {
    set({ transferAccepted: true });
  },

  resetTransferAccepted: () => set({ transferAccepted: false }),

  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  resetUnread: () => set({ unreadCount: 0 }),
}));
