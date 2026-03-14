import { getPrograms as getProgramsLegacy, getSubjectsByProgram as getSubjectsByProgramLegacy } from "@/lib/services/facultyService"
import {
  addMySubject as addMySubjectLegacy,
  getMyPrograms as getMyProgramsLegacy,
  getMySubjects as getMySubjectsLegacy,
  getProfile as getProfileLegacy,
  removeMySubject as removeMySubjectLegacy,
  setPrimaryProgram as setPrimaryProgramLegacy,
  updateProfile as updateProfileLegacy,
  uploadAvatar as uploadAvatarLegacy,
} from "@/lib/services/profileService"

export const getPrograms = getProgramsLegacy
export const getSubjectsByProgram = getSubjectsByProgramLegacy

export const addMySubject = addMySubjectLegacy
export const getMyPrograms = getMyProgramsLegacy
export const getMySubjects = getMySubjectsLegacy
export const getProfile = getProfileLegacy
export const removeMySubject = removeMySubjectLegacy
export const setPrimaryProgram = setPrimaryProgramLegacy
export const updateProfile = updateProfileLegacy
export const uploadAvatar = uploadAvatarLegacy
