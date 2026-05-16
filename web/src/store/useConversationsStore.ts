import { createConversationsStore } from "@uniconnect/shared-state";
import { deps } from "./deps";

export const useConversationsStore = createConversationsStore({
  apiClients: {
    auth: deps.apiClients.auth,
    messaging: deps.apiClients.messaging,
    messagingRealtime: deps.apiClients.messagingRealtime,
  },
  storage: deps.storage,
  logger: deps.logger,
});
