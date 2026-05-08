// URLs de endpoints de la API
export const API_ENDPOINTS = {
  // AUTH
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_ME: "/auth/me",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_GOOGLE: "/auth/google",

  // PROFILES
  PROFILE_GET: "/profiles",
  PROFILE_UPDATE: "/profiles",
  PROFILE_BY_ID: (id: string) => `/profiles/${id}`,
  PROFILE_PUBLIC: (id: string) => `/profiles/${id}/public`,

  // STUDY GROUPS
  STUDY_GROUPS_LIST: "/study-groups",
  STUDY_GROUPS_CREATE: "/study-groups",
  STUDY_GROUPS_BY_ID: (id: string) => `/study-groups/${id}`,
  STUDY_GROUPS_INVITE: (id: string) => `/study-groups/${id}/invite`,
  STUDY_GROUPS_LEAVE: (id: string) => `/study-groups/${id}/leave`,

  // APPLICATIONS
  APPLICATIONS_LIST: "/applications",
  APPLICATIONS_BY_ID: (id: string) => `/applications/${id}`,
  APPLICATIONS_ACCEPT: (id: string) => `/applications/${id}/accept`,
  APPLICATIONS_REJECT: (id: string) => `/applications/${id}/reject`,
  APPLICATIONS_CREATE: "/applications",

  // MESSAGES
  MESSAGES_LIST: (conversationId: string) => `/conversations/${conversationId}/messages`,
  MESSAGES_SEND: (conversationId: string) => `/conversations/${conversationId}/messages`,
  CONVERSATIONS_LIST: "/conversations",
  CONVERSATIONS_BY_ID: (id: string) => `/conversations/${id}`,
  CONVERSATIONS_CREATE: "/conversations",

  // RESOURCES
  RESOURCES_LIST: "/resources",
  RESOURCES_CREATE: "/resources",
  RESOURCES_BY_ID: (id: string) => `/resources/${id}`,
  RESOURCES_DELETE: (id: string) => `/resources/${id}`,

  // EVENTS
  EVENTS_LIST: "/events",
  EVENTS_CREATE: "/events",
  EVENTS_BY_ID: (id: string) => `/events/${id}`,
  EVENTS_UPDATE: (id: string) => `/events/${id}`,
  EVENTS_DELETE: (id: string) => `/events/${id}`,

  // CATALOG (Academic)
  FACULTIES: "/faculties",
  PROGRAMS: "/programs",
  PROGRAMS_BY_FACULTY: (facultyId: string) => `/faculties/${facultyId}/programs`,
  SUBJECTS: "/subjects",
  SUBJECTS_BY_PROGRAM: (programId: string) => `/programs/${programId}/subjects`,

  // ADMIN
  ADMIN_USERS: "/admin/users",
  ADMIN_REQUESTS: "/admin/requests",
  ADMIN_RESOURCES: "/admin/resources",
  ADMIN_EVENTS: "/admin/events",
  ADMIN_METRICS: "/admin/metrics",
};
