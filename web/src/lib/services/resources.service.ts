import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { StudyResource, CreateStudyResourcePayload } from "@/types";

/**
 * Servicio de recursos de estudio
 */
const resourcesService = {
  /**
   * Obtiene la lista de recursos de estudio con filtros opcionales
   */
  async listResources(filters?: {
    subject_id?: string;
    program_id?: string;
    page?: number;
    per_page?: number;
  }): Promise<StudyResource[]> {
    try {
      const response = await apiClient.get<{ data: StudyResource[] }>(
        API_ENDPOINTS.RESOURCES_LIST,
        { params: filters }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  },

  /**
   * Obtiene los detalles de un recurso por ID
   */
  async getResourceById(id: string): Promise<StudyResource> {
    try {
      const response = await apiClient.get<{ data: StudyResource }>(
        API_ENDPOINTS.RESOURCES_BY_ID(id)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching resource ${id}:`, error);
      throw error;
    }
  },

  /**
   * Carga un nuevo recurso de estudio
   */
  async uploadResource(
    payload: CreateStudyResourcePayload
  ): Promise<StudyResource> {
    try {
      const response = await apiClient.post<{ data: StudyResource }>(
        API_ENDPOINTS.RESOURCES_CREATE,
        payload
      );
      return response.data.data;
    } catch (error) {
      console.error("Error uploading resource:", error);
      throw error;
    }
  },

  /**
   * Elimina un recurso de estudio
   */
  async deleteResource(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.RESOURCES_DELETE(id));
    } catch (error) {
      console.error(`Error deleting resource ${id}:`, error);
      throw error;
    }
  },
};

export default resourcesService;
