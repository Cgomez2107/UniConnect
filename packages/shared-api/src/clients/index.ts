export { BaseClient } from "./BaseClient.js";
export type { RetryConfig } from "./BaseClient.js";
export { AuthClient } from "./AuthClient.js";
export type { SignInCredentials, SignUpPayload } from "./AuthClient.js";
export * from "./messaging/index.js";

export { StudyGroupsClient } from "./StudyGroupsClient.js";
export type {
  CreateStudyGroupPayload,
  SendGroupMessagePayload,
  ListApplicationsParams,
} from "./StudyGroupsClient.js";

export { ProfilesClient } from "./ProfilesClient.js";
export type {
  UpdateProfilePayload,
  StudentSearchResult,
  StudentPublicProfile,
} from "./ProfilesClient.js";

export { ResourcesClient } from "./ResourcesClient.js";
export type {
  CreateStudyResourcePayload,
  UpdateStudyResourcePayload,
  ListResourcesFilters,
} from "./ResourcesClient.js";

export { EventsClient } from "./EventsClient.js";
export type {
  CreateEventPayload,
  ListEventsFilters,
} from "./EventsClient.js";

export { NotificationsClient } from "./NotificationsClient.js";

export { AdminClient } from "./AdminClient.js";
export type {
  AdminUser,
  AdminRequest,
  AdminResource,
  AdminEvent,
  AdminMetrics,
} from "./AdminClient.js";
