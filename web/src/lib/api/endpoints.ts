/**
 * ============================================================================
 * DEFINICIÓN CENTRALIZADA DE ENDPOINTS DE LA API
 * ============================================================================
 * 
 * IMPORTANTE: Los paths definidos aquí DEBEN SER RELATIVOS (sin /api/v1)
 * porque el cliente HTTP añade automáticamente el prefijo /api/v1 en el baseURL.
 * 
 * Patrón CORRECTO:
 * - Endpoint: /study-groups
 * - baseURL: http://localhost:3000/api/v1
 * - URL Final: http://localhost:3000/api/v1/study-groups ✅
 * 
 * Patrón INCORRECTO (genera duplicación):
 * - Endpoint: /api/v1/study-groups
 * - baseURL: http://localhost:3000/api/v1
 * - URL Final: http://localhost:3000/api/v1/api/v1/study-groups ❌
 * 
 * NUNCA añadas /api/v1 en los endpoints definidos aquí.
 */

export const API_ENDPOINTS = {
  // ========================================================================
  // AUTHENTICATION
  // ========================================================================
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_ME: "/auth/me",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_GOOGLE: "/auth/google",
  AUTH_OAUTH_CALLBACK: "/auth/oauth/callback",

  // ========================================================================
  // PROFILES (profiles-catalog service)
  // ========================================================================
  PROFILE_GET: "/students/me",
  PROFILE_UPDATE: "/students/me",
  PROFILE_BY_ID: (id: string) => `/students/${id}`,
  PROFILE_PUBLIC: (id: string) => `/students/${id}`,

  // ========================================================================
  // STUDY GROUPS
  // ========================================================================
  STUDY_GROUPS_LIST: "/study-groups",
  STUDY_GROUPS_CREATE: "/study-groups",
  STUDY_GROUPS_BY_ID: (id: string) => `/study-groups/${id}`,
  STUDY_GROUPS_INVITE: (id: string) => `/study-groups/${id}/invite`,
  STUDY_GROUPS_LEAVE: (id: string) => `/study-groups/${id}/leave`,
  STUDY_GROUPS_CANCEL: (id: string) => `/study-groups/${id}/cancel`,
  STUDY_GROUPS_MEMBERS: (id: string) => `/study-groups/${id}/members`,
  STUDY_GROUPS_MESSAGES: (id: string) => `/study-groups/${id}/messages`,
  STUDY_GROUPS_TRANSFER: (id: string) => `/study-groups/${id}/transfer`,
  STUDY_GROUPS_TRANSFER_ACCEPT: (id: string) => `/study-groups/transfers/${id}/accept`,

  // ========================================================================
  // APPLICATIONS (Study Group Requests)
  // ========================================================================
  APPLICATIONS_LIST: "/study-groups/applications",
  APPLICATIONS_BY_ID: (id: string) => `/study-groups/applications/${id}`,
  APPLICATIONS_REVIEW: (id: string) => `/study-groups/applications/${id}/review`,
  APPLICATIONS_CREATE: "/study-groups/applications",

  // ========================================================================
  // MESSAGING & CONVERSATIONS
  // ========================================================================
  MESSAGES_LIST: "/messages",
  MESSAGES_SEND: "/messages",
  CONVERSATIONS_LIST: "/conversations",
  CONVERSATIONS_BY_ID: (id: string) => `/conversations/${id}`,
  CONVERSATIONS_CREATE: "/conversations",
  CONVERSATIONS_MARK_READ: (id: string) => `/conversations/${id}/read`,

  // ========================================================================
  // RESOURCES
  // ========================================================================
  RESOURCES_LIST: "/resources",
  RESOURCES_CREATE: "/resources",
  RESOURCES_BY_ID: (id: string) => `/resources/${id}`,
  RESOURCES_DELETE: (id: string) => `/resources/${id}`,

  // ========================================================================
  // EVENTS
  // ========================================================================
  EVENTS_LIST: "/events",
  EVENTS_CREATE: "/events",
  EVENTS_BY_ID: (id: string) => `/events/${id}`,
  EVENTS_UPDATE: (id: string) => `/events/${id}`,
  EVENTS_DELETE: (id: string) => `/events/${id}`,

  // ========================================================================
  // PROFILE RELATIONSHIPS (my programs, subjects, avatar)
  // ========================================================================
  MY_PROGRAMS: "/students/me/programs",
  MY_SUBJECTS: "/students/me/subjects",
  ADD_MY_SUBJECT: "/students/me/subjects",
  REMOVE_MY_SUBJECT: (subjectId: string) => `/students/me/subjects/${subjectId}`,
  SET_PRIMARY_PROGRAM: "/students/me/primary-program",
  UPLOAD_AVATAR: "/students/me/avatar",

  // ========================================================================
  // MY STUDY REQUESTS
  // ========================================================================
  MY_STUDY_REQUESTS: "/study-groups/me",

  // ========================================================================
  // CATALOG (Academic Catalog)
  // ========================================================================
  FACULTIES: "/catalog/faculties",
  PROGRAMS: "/catalog/programs",
  PROGRAMS_BY_FACULTY: (facultyId: string) => `/catalog/faculties/${facultyId}/programs`,
  SUBJECTS: "/catalog/subjects",
  SUBJECTS_BY_PROGRAM: (programId: string) => `/catalog/programs/${programId}/subjects`,

  // ========================================================================
  // ADMIN
  // ========================================================================
  ADMIN_USERS: "/admin/users",
  ADMIN_REQUESTS: "/admin/requests",
  ADMIN_RESOURCES: "/admin/resources",
  ADMIN_EVENTS: "/admin/events",
  ADMIN_METRICS: "/admin/metrics",

  // ========================================================================
  // NOTIFICATIONS
  // ========================================================================
  NOTIFICATIONS_LIST: "/notifications",
} as const;

// ============================================================================
// VALIDACIÓN DEFENSIVA EN DESARROLLO
// ============================================================================

if (import.meta.env.DEV) {
  // Verificar que ningún endpoint tenga /api/v1
  Object.entries(API_ENDPOINTS).forEach(([key, value]) => {
    const endpoint = typeof value === "function" ? value("test-id") : value;
    if (endpoint.includes("/api/v1")) {
      console.error(
        `[ENDPOINTS-ERROR] Endpoint "${key}" contiene /api/v1. ` +
        `Debe ser solo la ruta relativa. Valor: "${endpoint}"`
      );
    }
  });
}

// ============================================================================
// TIPOS Y EXPORTS
// ============================================================================

export type ApiEndpointKey = keyof typeof API_ENDPOINTS;
