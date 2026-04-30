import { create } from "zustand";

interface ActiveTransfer {
  transferId: string;
  requestId: string;
  actorUserId: string;
  groupName?: string;
  senderName?: string;
}

interface ActiveJoinRequest {
  requestId: string;
  applicantId: string;
  applicantName?: string;
  message?: string;
  groupName?: string;
}

interface NotificationState {
  activeTransfer: ActiveTransfer | null;
  isTransferModalOpen: boolean;
  transferAccepted: boolean;

  activeJoinRequest: ActiveJoinRequest | null;
  isJoinRequestModalOpen: boolean;

  activeWelcome: { groupName: string } | null;
  isWelcomeModalOpen: boolean;

  // Actions
  setTransferData: (data: ActiveTransfer) => void;
  clearTransfer: () => void;
  markTransferAccepted: (requestId: string) => void;
  resetTransferAccepted: () => void;

  showJoinRequestModal: (data: ActiveJoinRequest) => void;
  clearJoinRequest: () => void;

  showWelcomeModal: (groupName: string) => void;
  clearWelcome: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  activeTransfer: null,
  isTransferModalOpen: false,
  transferAccepted: false,

  activeJoinRequest: null,
  isJoinRequestModalOpen: false,

  activeWelcome: null,
  isWelcomeModalOpen: false,

  setTransferData: (data) => set({
    activeTransfer: data,
    isTransferModalOpen: true
  }),

  clearTransfer: () => set({
    activeTransfer: null,
    isTransferModalOpen: false
  }),

  markTransferAccepted: (requestId) => {
    set({ transferAccepted: true });
  },

  resetTransferAccepted: () => set({ transferAccepted: false }),

  showJoinRequestModal: (data) => set({
    activeJoinRequest: data,
    isJoinRequestModalOpen: true
  }),

  clearJoinRequest: () => set({
    activeJoinRequest: null,
    isJoinRequestModalOpen: false
  }),

  showWelcomeModal: (groupName) => set({
    activeWelcome: { groupName },
    isWelcomeModalOpen: true
  }),

  clearWelcome: () => set({
    activeWelcome: null,
    isWelcomeModalOpen: false
  }),
}));
