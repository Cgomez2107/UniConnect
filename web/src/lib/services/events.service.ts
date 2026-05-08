import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { CampusEvent as CampusEventApi, CreateEventPayload } from "@/types";
import { mapCampusEventApiToUI } from "@/utils/mappers";
import { CampusEventUI } from "@/types/ui";

/**
 * Servicio de eventos del campus
 */
const eventsService = {
  /**
   * Obtiene la lista de eventos del campus con filtros opcionales
   */
  async listEvents(filters?: {
    category?: string;
    page?: number;
    per_page?: number;
  }): Promise<CampusEventUI[]> {
    try {
      const response = await apiClient.get<{ data: CampusEventApi[] }>(
        API_ENDPOINTS.EVENTS_LIST,
        { params: filters }
      );
      return response.data.data.map(mapCampusEventApiToUI);
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  },

  /**
   * Obtiene los detalles de un evento por ID
   */
  async getEventById(id: string): Promise<CampusEventUI> {
    try {
      const response = await apiClient.get<{ data: CampusEventApi }>(
        API_ENDPOINTS.EVENTS_BY_ID(id)
      );
      return mapCampusEventApiToUI(response.data.data);
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo evento del campus
   */
  async createEvent(data: CreateEventPayload): Promise<CampusEventUI> {
    try {
      const response = await apiClient.post<{ data: CampusEventApi }>(
        API_ENDPOINTS.EVENTS_CREATE,
        data
      );
      return mapCampusEventApiToUI(response.data.data);
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  /**
   * Actualiza un evento del campus
   */
    async updateEvent(
    id: string,
    data: CreateEventPayload
  ): Promise<CampusEventUI> {
    try {
      const response = await apiClient.patch<{ data: CampusEventApi }>(
        API_ENDPOINTS.EVENTS_UPDATE(id),
        data
      );
      return mapCampusEventApiToUI(response.data.data);
    } catch (error) {
      console.error(`Error updating event ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un evento del campus
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.EVENTS_DELETE(id));
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error);
      throw error;
    }
  },
};

export default eventsService;
