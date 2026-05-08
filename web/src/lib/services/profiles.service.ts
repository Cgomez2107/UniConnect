import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  Profile,
  EditProfileFormData,
  StudentPublicProfile,
  StudentSearchResult,
} from "@/types";

/**
 * Servicio de gestión de perfiles de usuario
 */
const profilesService = {
  /**
   * Obtiene el perfil del usuario autenticado
   */
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

  /**
   * Actualiza el perfil del usuario autenticado
   */
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

  /**
   * Obtiene el perfil de un usuario por su ID
   */
  async getProfileById(userId: string): Promise<Profile> {
    try {
      const response = await apiClient.get<{ data: Profile }>(
        API_ENDPOINTS.PROFILE_BY_ID(userId)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene el perfil público de un usuario (con materias compartidas)
   */
  async getPublicProfile(userId: string): Promise<StudentPublicProfile> {
    try {
      const response = await apiClient.get<{ data: StudentPublicProfile }>(
        API_ENDPOINTS.PROFILE_PUBLIC(userId)
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching public profile for user ${userId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Busca estudiantes que comparten una materia
   */
  async searchStudents(subjectId: string): Promise<StudentSearchResult[]> {
    try {
      const response = await apiClient.get<{ data: StudentSearchResult[] }>(
        `/subjects/${subjectId}/students`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error searching students for subject ${subjectId}:`, error);
      throw error;
    }
  },
};

export default profilesService;
