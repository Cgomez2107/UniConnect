import { createStudyGroupsStore } from "@uniconnect/shared-state";
import { deps } from "./deps";

export const useStudyGroupsStore = createStudyGroupsStore({
  apiClients: {
    auth: deps.apiClients.auth,
    messaging: deps.apiClients.messaging,
    messagingRealtime: deps.apiClients.messagingRealtime,
    studyGroups: deps.apiClients.studyGroups,
  },
  storage: deps.storage,
  logger: deps.logger,
});
