import {
  createStudyRequest as createStudyRequestLegacy,
  getAvailableSubjectsForCurrentUser as getAvailableSubjectsForCurrentUserLegacy,
  getEnrolledSubjectsForUser as getEnrolledSubjectsForUserLegacy,
  type Subject as CatalogSubject,
} from "@/lib/services/studyRequestsService"

export type Subject = CatalogSubject

export const createStudyRequest = createStudyRequestLegacy
export const getAvailableSubjectsForCurrentUser = getAvailableSubjectsForCurrentUserLegacy
export const getEnrolledSubjectsForUser = getEnrolledSubjectsForUserLegacy
