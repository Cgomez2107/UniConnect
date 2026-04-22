import { DIContainer } from "@/lib/services/di/container";
import { createUnreadCountStore } from "@/store/useUnreadCountStore";

const container = DIContainer.getInstance();

export const useUnreadCountStore = createUnreadCountStore(
  container.getGetTotalUnreadCount(),
);
