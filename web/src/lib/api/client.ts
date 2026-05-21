import axios, { AxiosInstance, AxiosError } from "axios";
import { parseGroupError } from "./groupErrorInterceptor";
import { useNotificationStore } from "../../store/useNotificationStore";
import type { Notification } from "@uniconnect/shared-types";

/**
 * ============================================================================
 * CONFIGURACIÓN CENTRALIZADA DE API HTTP CLIENT
 * ============================================================================
 * 
 * Esta es la ÚNICA fuente de verdad para configuración HTTP.
 * Evita duplicaciones de rutas y proporciona un punto central para:
 * - Autenticación
 * - Interceptores
 * - Manejo de errores
 * - Logging
 */

// ============================================================================
// CONSTANTS & ENV VARIABLES
// ============================================================================

/**
 * Gateway URL - SOLO incluye el scheme + host + puerto
 * NO incluye /api/v1 - ese prefijo se añade en los endpoints
 * 
 * Ejemplos:
 * - Development: http://localhost:3000
 * - Production: https://api.example.com
 */
const GATEWAY_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, "") || "http://localhost:3000";

/**
 * API Prefix - es el prefijo de versionado
 * Se combina con GATEWAY_BASE_URL para crear el baseURL completo
 */
const API_PREFIX = "/api/v1";

/**
 * Base URL completa para Axios
 * INVARIANTE: baseURL DEBE ser gateway + prefix, nunca duplicado
 */
const API_BASE_URL = `${GATEWAY_BASE_URL}${API_PREFIX}`;

/**
 * Key para almacenar el token en localStorage
 * Usado por los interceptores
 */
const AUTH_SESSION_KEY = "uniconnect-auth-session";

/**
 * Versión de la API para debugging
 */
const API_VERSION = "v1";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene el token de acceso desde storage
 * Intenta múltiples ubicaciones para retrocompatibilidad
 */
function getAccessToken(): string | null {
  try {
    // Intenta primero el almacenamiento Zustand
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
      if (parsed?.state?.accessToken) {
        return parsed.state.accessToken;
      }
    }
  } catch (error) {
    console.warn("[API] Error parsing Zustand state:", error);
  }

  // Fallback al localStorage directo
  return localStorage.getItem("accessToken");
}

/**
 * Valida que una URL no tenga duplicación de prefijo
 * Útil para debugging y validación defensiva
 */
function validateUrlNoDuplication(url: string): void {
  const API_V1_COUNT = (url.match(/\/api\/v1/g) || []).length;
  if (API_V1_COUNT > 1) {
    console.error(
      `[API-ERROR] URL con duplicación detectada: "${url}"`,
      `Contiene /api/v1 ${API_V1_COUNT} veces. Verificar baseURL + endpoint.`
    );
  }
}

// ============================================================================
// AXIOS CLIENT FACTORY
// ============================================================================

/**
 * Factory function para crear la instancia de Axios
 * Permite reutilizar la configuración en diferentes contextos
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 segundos
    withCredentials: true, // Necesario para CORS con cookies
    headers: {
      "Content-Type": "application/json",
      "X-API-Version": API_VERSION,
    },
  });

  return client;
}

// Crear la instancia única
export const apiClient: AxiosInstance = createApiClient();

// ============================================================================
// REQUEST INTERCEPTOR: Autenticación
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("[API] Error obteniendo token:", error);
    }

    // Validación defensiva (DEBUG)
    if (config.url) {
      const fullUrl = config.baseURL + config.url;
      validateUrlNoDuplication(fullUrl);
    }

    return config;
  },
  (error) => {
    console.error("[API] Error en request interceptor:", error);
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR: Manejo global de errores
// ============================================================================

apiClient.interceptors.response.use(
  (response) => {
    // Log exitoso en desarrollo
    if (import.meta.env.DEV) {
      console.debug(
        `[API] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url;

    // Log del error
    console.error(
      `[API-ERROR] ${error.config?.method?.toUpperCase()} ${url} → ${status}`,
      error.response?.data || error.message
    );

    // 401 Unauthorized — debug: cookie faltante vs token expirado
    if (status === 401) {
      const body = error.response?.data as Record<string, unknown> | string | undefined;
      const message =
        (typeof body === "object" && body !== null
          ? (body as Record<string, unknown>).error ?? (body as Record<string, unknown>).message
          : body) ?? "";
      const messageStr = typeof message === "string" ? message : "";

      const hasCookie = typeof navigator !== "undefined" && Boolean(document?.cookie);
      const hadToken = !!localStorage.getItem(AUTH_SESSION_KEY) || !!localStorage.getItem("accessToken");

      const isExpired = /expir|venci|invalid.*token|token.*invalid/i.test(messageStr);
      const isMissingCookie = !hasCookie || /no.auth|unauthorized|missing.*credential/i.test(messageStr);

      console.groupCollapsed(
        "%c[Axios 401]",
        "color: #ef4444; font-weight: bold",
        url,
      );
      if (isMissingCookie && !hadToken) {
        console.warn("No hay sesión — usuario no autenticado");
      } else if (isMissingCookie) {
        console.warn("Cookie no enviada — revisar withCredentials y CORS");
      } else if (isExpired) {
        console.warn("Token/cookie expirada — sesión terminada");
      } else {
        console.warn("401 sin clasificar — revisar backend");
      }
      console.info("Respuesta:", messageStr);
      console.info("URL:", `${error.config?.baseURL ?? ""}${url ?? ""}`);
      console.info("Tenía token:", hadToken);
      console.info("Cookie presente:", hasCookie);
      console.groupEnd();

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem(AUTH_SESSION_KEY);
      if (hadToken) {
        window.location.href = "/login";
      }
    }

    // 403 Forbidden - Acceso prohibido
    if (status === 403) {
      console.error("[API] Acceso prohibido (403):", error.response?.data);
    }

    // 404 Not Found
    if (status === 404) {
      console.error("[API] Recurso no encontrado (404):", url);
    }

    // 500+ Server Error
    if (status && status >= 500) {
      console.error("[API] Error del servidor:", error.response?.data);
    }

    // Estado inválido / error de dominio: mostrar toast al usuario
    if (status && [400, 403, 409, 422].includes(status)) {
      const friendly = parseGroupError(error);
      try {
        const store = useNotificationStore.getState();
        if (typeof store.addNotification === "function") {
          const toastNotif: Notification = {
            id: `toast-${Date.now()}`,
            userId: "",
            type: "system",
            title: friendly,
            read: false,
            createdAt: new Date(),
          };
          store.addNotification(toastNotif);
        }
      } catch (e) {
        console.warn("[API] No se pudo mostrar toast de error:", e);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

export { GATEWAY_BASE_URL, API_PREFIX, API_BASE_URL, API_VERSION };
export default apiClient;
