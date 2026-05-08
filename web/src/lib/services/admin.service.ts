import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  AdminUser as AdminUserApi,
  AdminRequest as AdminRequestApi,
  AdminResource as AdminResourceApi,
  AdminEvent as AdminEventApi,
  AdminMetrics,
} from "@/types";
import { mapAdminUserApiToUI, mapStudyRequestApiToUI } from "@/utils/mappers";
import { AdminUserUI, StudyRequestUI } from "@/types/ui";

/**
 * Servicio de operaciones administrativas
 */
const adminService = {
  /**
   * Obtiene la lista de usuarios registrados
   */
  async getUsers(): Promise<AdminUserUI[]> {
    try {
      const response = await apiClient.get<{ data: AdminUserApi[] }>(
        API_ENDPOINTS.ADMIN_USERS
      );
      return response.data.data.map(mapAdminUserApiToUI);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de solicitudes de grupos de estudio
   */
  async getRequests(): Promise<AdminRequestApi[]> {
    try {
      const response = await apiClient.get<{ data: AdminRequestApi[] }>(
        API_ENDPOINTS.ADMIN_REQUESTS
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching requests:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de recursos de estudio
   */
  async getResources(): Promise<AdminResourceApi[]> {
    try {
      const response = await apiClient.get<{ data: AdminResourceApi[] }>(
        API_ENDPOINTS.ADMIN_RESOURCES
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de eventos del campus
   */
  async getEvents(): Promise<AdminEventApi[]> {
    try {
      const response = await apiClient.get<{ data: AdminEventApi[] }>(
        API_ENDPOINTS.ADMIN_EVENTS
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  },

  /**
   * Obtiene las métricas globales del dashboard administrativo
   */
  async getMetrics(): Promise<AdminMetrics> {
    try {
      const response = await apiClient.get<{ data: AdminMetrics }>(
        API_ENDPOINTS.ADMIN_METRICS
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching metrics:", error);
      throw error;
    }
  },
};

export default adminService;
