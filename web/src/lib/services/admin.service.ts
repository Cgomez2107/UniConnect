import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  AdminUser,
  AdminRequest,
  AdminResource,
  AdminEvent,
  AdminMetrics,
} from "@/types";

/**
 * Servicio de operaciones administrativas
 */
const adminService = {
  /**
   * Obtiene la lista de usuarios registrados
   */
  async getUsers(): Promise<AdminUser[]> {
    try {
      const response = await apiClient.get<{ data: AdminUser[] }>(
        API_ENDPOINTS.ADMIN_USERS
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de solicitudes de grupos de estudio
   */
  async getRequests(): Promise<AdminRequest[]> {
    try {
      const response = await apiClient.get<{ data: AdminRequest[] }>(
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
  async getResources(): Promise<AdminResource[]> {
    try {
      const response = await apiClient.get<{ data: AdminResource[] }>(
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
  async getEvents(): Promise<AdminEvent[]> {
    try {
      const response = await apiClient.get<{ data: AdminEvent[] }>(
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
