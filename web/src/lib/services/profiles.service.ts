import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  Profile,
  EditProfileFormData,
  StudentPublicProfile,
  StudentSearchResult,
  UserProgram,
  UserSubject,
  Program,
  Subject,
  StudyRequest,
} from "@/types";

/**
 * Servicio de gestión de perfiles de usuario
 */
const profilesService = {
  async getProfile(): Promise<Profile> {
    try {
      const response = await apiClient.get<{ data: Profile }>(
        API_ENDPOINTS.PROFILE_GET
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },

  async getFullProfile(userId: string): Promise<any> {
    try {
      const response = await apiClient.get<{ data: any }>(
        `/students/${userId}?vista=completa`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching full profile:", error);
      throw error;
    }
  },

  async updateProfile(data: EditProfileFormData): Promise<Profile> {
    try {
      const response = await apiClient.patch<{ data: Profile }>(
        API_ENDPOINTS.PROFILE_UPDATE,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  async getProfileById(userId: string): Promise<Profile> {
    try {
      const response = await apiClient.get<{ data: Profile }>(
        `/students/${userId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      throw error;
    }
  },

  async getPublicProfile(userId: string): Promise<StudentPublicProfile> {
    try {
      const response = await apiClient.get<{ data: StudentPublicProfile }>(
        `/students/${userId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching public profile for user ${userId}:`, error);
      throw error;
    }
  },

  async searchStudents(subjectId: string): Promise<StudentSearchResult[]> {
    try {
      const response = await apiClient.get<{ data: StudentSearchResult[] }>(
        `/students?subjectId=${subjectId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error searching students for subject ${subjectId}:`, error);
      throw error;
    }
  },

  async getMyPrograms(): Promise<UserProgram[]> {
    try {
      const response = await apiClient.get<{ data: UserProgram[] }>(
        API_ENDPOINTS.MY_PROGRAMS
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching my programs:", error);
      throw error;
    }
  },

  async getMySubjects(): Promise<UserSubject[]> {
    try {
      const response = await apiClient.get<{ data: UserSubject[] }>(
        API_ENDPOINTS.MY_SUBJECTS
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching my subjects:", error);
      throw error;
    }
  },

  async setPrimaryProgram(programId: string): Promise<void> {
    try {
      await apiClient.patch(API_ENDPOINTS.SET_PRIMARY_PROGRAM, { program_id: programId });
    } catch (error) {
      console.error("Error setting primary program:", error);
      throw error;
    }
  },

  async uploadAvatar(userId: string, base64Data: string): Promise<string> {
    try {
      // Remove existing avatar first (silently ignores 404)
      await apiClient.delete(API_ENDPOINTS.UPLOAD_AVATAR).catch(() => {});

      const response = await apiClient.post<{ data: { url: string } }>(
        API_ENDPOINTS.UPLOAD_AVATAR,
        { user_id: userId, image: base64Data }
      );
      return response.data.data.url;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  },

  async addMySubject(subjectId: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.ADD_MY_SUBJECT, { subject_id: subjectId });
    } catch (error) {
      console.error("Error adding subject:", error);
      throw error;
    }
  },

  async removeMySubject(subjectId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.REMOVE_MY_SUBJECT(subjectId));
    } catch (error) {
      console.error(`Error removing subject ${subjectId}:`, error);
      throw error;
    }
  },

  async getPrograms(): Promise<Program[]> {
    try {
      const response = await apiClient.get<{ data: Program[] }>(
        API_ENDPOINTS.PROGRAMS
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching programs:", error);
      throw error;
    }
  },

  async getSubjectsByProgram(programId: string): Promise<Subject[]> {
    try {
      const response = await apiClient.get<{ data: Subject[] }>(
        API_ENDPOINTS.SUBJECTS_BY_PROGRAM(programId)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching subjects for program ${programId}:`, error);
      throw error;
    }
  },
};

export default profilesService;
