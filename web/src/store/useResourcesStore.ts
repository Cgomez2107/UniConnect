import { createResourcesStore } from "@uniconnect/shared-state";
import { deps } from "./deps";

export const useResourcesStore = createResourcesStore({
  apiClients: {
    auth: deps.apiClients.auth,
    messaging: deps.apiClients.messaging,
    messagingRealtime: deps.apiClients.messagingRealtime,
    resources: deps.apiClients.resources,
  },
  storage: deps.storage,
  logger: deps.logger,
});
