import { createForumStore } from "@uniconnect/shared-state";
import { deps } from "./deps";

export const useForumStore = createForumStore({
  apiClients: {
    auth: deps.apiClients.auth,
    messaging: deps.apiClients.messaging,
    messagingRealtime: deps.apiClients.messagingRealtime,
    forum: deps.apiClients.forum,
  },
  storage: deps.storage,
  logger: deps.logger,
});
