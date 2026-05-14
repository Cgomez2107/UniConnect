import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  StudyRequest,
  StudyGroup,
  CreateStudyRequestPayload,
  Application,
  Member,
  AppNotification,
} from "@/types";

/**
 * Servicio de gestión de grupos de estudio
 */
const studyGroupsService = {
  /**
   * Obtiene la lista de todas las solicitudes de grupos de estudio
   */
  async listStudyGroups(): Promise<StudyRequest[]> {
    try {
      const response = await apiClient.get<{ data: StudyRequest[] }>(
        API_ENDPOINTS.STUDY_GROUPS_LIST
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching study groups:", error);
      throw error;
    }
  },

  /**
   * Obtiene los detalles de un grupo de estudio por ID
   */
  async getStudyGroupById(id: string): Promise<StudyRequest> {
    try {
      const response = await apiClient.get<{ data: StudyRequest }>(
        API_ENDPOINTS.STUDY_GROUPS_BY_ID(id)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching study group ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva solicitud de grupo de estudio
   */
  async createStudyGroup(
    data: CreateStudyRequestPayload
  ): Promise<StudyRequest> {
    try {
      const response = await apiClient.post<{ data: StudyRequest }>(
        API_ENDPOINTS.STUDY_GROUPS_CREATE,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating study group:", error);
      throw error;
    }
  },

  /**
   * Invita a un usuario a un grupo de estudio
   */
  async inviteToStudyGroup(groupId: string, userId: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.STUDY_GROUPS_INVITE(groupId), {
        user_id: userId,
      });
    } catch (error) {
      console.error(
        `Error inviting user ${userId} to group ${groupId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obtiene la lista de miembros de un grupo de estudio
   */
  async getStudyGroupMembers(groupId: string): Promise<Member[]> {
    try {
      const response = await apiClient.get<{ data: Member[] }>(
        API_ENDPOINTS.STUDY_GROUPS_MEMBERS(groupId)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching members for group ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Abandona un grupo de estudio
   */
  async leaveStudyGroup(groupId: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.STUDY_GROUPS_LEAVE(groupId));
    } catch (error) {
      console.error(`Error leaving study group ${groupId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene las solicitudes de aplicación para un grupo de estudio
   */
  async getStudyGroupApplications(groupId: string): Promise<Application[]> {
    try {
      const response = await apiClient.get<{ data: Application[] }>(
        `/study-groups/${groupId}/applications`
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching applications for group ${groupId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obtiene las aplicaciones del usuario autenticado
   */
  async listMyApplications(): Promise<Application[]> {
    try {
      const response = await apiClient.get<{ data: Application[] }>(
        API_ENDPOINTS.APPLICATIONS_LIST
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching my applications:", error);
      throw error;
    }
  },

  /**
   * Obtiene las solicitudes de estudio del usuario autenticado
   */
  async listMyStudyRequests(): Promise<StudyRequest[]> {
    try {
      const response = await apiClient.get<{ data: StudyRequest[] }>(
        API_ENDPOINTS.MY_STUDY_REQUESTS
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching my study requests:", error);
      throw error;
    }
  },

  /**
   * Postula al usuario actual a un grupo de estudio
   */
  async applyToStudyGroup(requestId: string, message: string): Promise<Application> {
    try {
      const response = await apiClient.post<{ data: Application }>(
        `/study-groups/${requestId}/apply`,
        { message }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error applying to study group ${requestId}:`, error);
      throw error;
    }
  },

  /**
   * Acepta una postulación
   */
  async acceptApplication(applicationId: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.APPLICATIONS_ACCEPT(applicationId));
    } catch (error) {
      console.error(`Error accepting application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Rechaza una postulación
   */
  async rejectApplication(applicationId: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.APPLICATIONS_REJECT(applicationId));
    } catch (error) {
      console.error(`Error rejecting application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Cancela/cierra una solicitud de grupo de estudio (solo autor)
   */
  async cancelStudyRequest(requestId: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.STUDY_GROUPS_CANCEL(requestId));
    } catch (error) {
      console.error(`Error cancelling study request ${requestId}:`, error);
      throw error;
    }
  },

  /**
   * Cancela mi postulación a un grupo
   */
  async listNotifications(): Promise<AppNotification[]> {
    try {
      const response = await apiClient.get<{ data: AppNotification[] }>(
        API_ENDPOINTS.NOTIFICATIONS_LIST
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  async cancelMyApplication(requestId: string): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.STUDY_GROUPS_LEAVE(requestId));
    } catch (error) {
      console.error(`Error cancelling application for ${requestId}:`, error);
      throw error;
    }
  },
};

export default studyGroupsService;
