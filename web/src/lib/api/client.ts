import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// REQUEST INTERCEPTOR: Agregar token de autenticación
// ============================================================================

apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error al obtener token:", error);
  }
  return config;
});

// ============================================================================
// RESPONSE INTERCEPTOR: Manejar errores globales
// ============================================================================

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Si es 401, el usuario no está autenticado
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    
    // Si es 403, no tiene permisos
    if (error.response?.status === 403) {
      console.error("Acceso prohibido:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
