import axios from "axios";
import { showErrorAlert } from "./errorHandler";

// API URL con fallback (Gateway)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Para cookies de sesión
});

// Interceptor para agregar token a cada request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, limpiar
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export { apiClient, API_BASE_URL };
export const fetchApi = async (
  endpoint: string,
  options: any = {}
) => {
  try {
    const response = await apiClient.request({
      url: endpoint,
      ...options,
    });
    return response.data;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

/**
 * Versión de fetchApi con manejo automático de errores.
 * Captura excepciones y muestra un alerta al usuario.
 */
export const fetchApiWithErrorHandling = async (
  endpoint: string,
  options: any = {},
  context?: string
) => {
  try {
    return await fetchApi(endpoint, options);
  } catch (error) {
    showErrorAlert(error, context ?? "operación");
    return null;
  }
};
