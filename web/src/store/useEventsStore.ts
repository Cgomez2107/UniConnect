import { createEventsStore } from "@uniconnect/shared-state";
import { deps } from "./deps";

export const useEventsStore = createEventsStore({
  apiClients: {
    auth: deps.apiClients.auth,
    messaging: deps.apiClients.messaging,
    messagingRealtime: deps.apiClients.messagingRealtime,
    events: deps.apiClients.events,
  },
  storage: deps.storage,
  logger: deps.logger,
});
