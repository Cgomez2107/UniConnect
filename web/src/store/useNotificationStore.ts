import { create } from "zustand";
import type { AppNotification } from "@/types";
import studyGroupsService from "@/lib/services/studyGroups.service";

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const data = await studyGroupsService.listNotifications();
      const unread = data.filter((n) => !n.readAt).length;
      set({ notifications: data, unreadCount: unread, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
