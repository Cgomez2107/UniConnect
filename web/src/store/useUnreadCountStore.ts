import { createUnreadCountStore } from "@uniconnect/shared-state";
import { deps } from "./deps";

export const useUnreadCountStore = createUnreadCountStore({
  logger: deps.logger,
});
