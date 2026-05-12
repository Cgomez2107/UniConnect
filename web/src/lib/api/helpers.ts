/**
 * ============================================================================
 * API HELPERS - Utilidades para construcción segura de URLs
 * ============================================================================
 * 
 * Funciones auxiliares para trabajar con URLs de API de forma segura,
 * evitando duplicaciones de prefijos y proporcionando validaciones.
 */

import { API_ENDPOINTS } from "./endpoints";
import { GATEWAY_BASE_URL, API_PREFIX } from "./client";

/**
 * Construye una URL completa de API
 * Útil para debugging o casos especiales
 * 
 * @param endpoint - La ruta del endpoint (ej: "/study-groups")
 * @returns URL completa (ej: "http://localhost:3000/api/v1/study-groups")
 * 
 * @example
 * const url = buildApiUrl("/study-groups");
 * // Returns: "http://localhost:3000/api/v1/study-groups"
 */
export function buildApiUrl(endpoint: string): string {
  // Validar que el endpoint no tiene duplicación
  if (endpoint.startsWith(API_PREFIX)) {
    console.warn(
      `[API-HELPER] Endpoint "${endpoint}" ya contiene ${API_PREFIX}. ` +
      `Se esperaba una ruta relativa como "/study-groups"`
    );
  }

  // Asegurar que el endpoint comienza con /
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Construir URL
  return `${GATEWAY_BASE_URL}${API_PREFIX}${normalizedEndpoint}`;
}

/**
 * Normaliza una URL removiendo duplicaciones de /api/v1
 * Útil para sanitizar URLs antes de hacer requests
 * 
 * @param url - URL potencialmente con duplicaciones
 * @returns URL normalizada sin duplicaciones
 * 
 * @example
 * const badUrl = "http://localhost:3000/api/v1/api/v1/study-groups";
 * const goodUrl = normalizeUrl(badUrl);
 * // Returns: "http://localhost:3000/api/v1/study-groups"
 */
export function normalizeUrl(url: string): string {
  // Reemplazar múltiples /api/v1 por uno solo
  return url.replace(new RegExp(`(${API_PREFIX})+`, "g"), API_PREFIX);
}

/**
 * Valida que una URL no tenga duplicaciones de prefijo
 * 
 * @param url - URL a validar
 * @returns true si la URL es válida, false si tiene duplicaciones
 * 
 * @example
 * if (!isValidApiUrl(requestUrl)) {
 *   console.error("URL duplicada detectada");
 * }
 */
export function isValidApiUrl(url: string): boolean {
  const matches = url.match(new RegExp(API_PREFIX, "g")) || [];
  // Debe contener exactamente 1 instancia de /api/v1
  return matches.length === 1;
}

/**
 * Obtiene el endpoint desde una URL completa
 * Útil para debugging
 * 
 * @param url - URL completa (ej: "http://localhost:3000/api/v1/study-groups")
 * @returns Solo la ruta relativa (ej: "/study-groups")
 * 
 * @example
 * const endpoint = extractEndpoint("http://localhost:3000/api/v1/study-groups");
 * // Returns: "/study-groups"
 */
export function extractEndpoint(url: string): string {
  const base = `${GATEWAY_BASE_URL}${API_PREFIX}`;
  if (url.startsWith(base)) {
    return url.slice(base.length) || "/";
  }
  return url;
}

/**
 * Verifica si una URL pertenece a esta API
 * 
 * @param url - URL a verificar
 * @returns true si la URL es de la API, false en caso contrario
 * 
 * @example
 * if (isApiUrl(url)) {
 *   // Procesar como API request
 * }
 */
export function isApiUrl(url: string): boolean {
  return url.startsWith(`${GATEWAY_BASE_URL}${API_PREFIX}`);
}

/**
 * Enum de valores para los tipos de método HTTP
 * Para type-safety en funciones que aceptan métodos
 */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
}

/**
 * Interfaz para parámetros de query
 */
export interface QueryParams {
  [key: string]: string | number | boolean | string[] | undefined;
}

/**
 * Construye una cadena de query parameters de forma segura
 * 
 * @param params - Objeto con los parámetros
 * @returns String de query params (ej: "?page=1&limit=10")
 * 
 * @example
 * const query = buildQueryString({ page: 1, limit: 10 });
 * // Returns: "?page=1&limit=10"
 */
export function buildQueryString(params: QueryParams): string {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join("&");
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .filter(Boolean)
    .join("&");

  return filtered ? `?${filtered}` : "";
}

/**
 * Tipo de validación de endpoint
 */
export type EndpointValidator = (endpoint: string) => boolean;

/**
 * Crea un validador de endpoint
 * 
 * @param pattern - Patrón regex o string
 * @returns Función validadora
 * 
 * @example
 * const isStudyGroupEndpoint = createEndpointValidator(/study-groups/);
 * if (isStudyGroupEndpoint(endpoint)) {
 *   // Handle study group requests
 * }
 */
export function createEndpointValidator(pattern: RegExp | string): EndpointValidator {
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  return (endpoint: string) => regex.test(endpoint);
}

/**
 * Validators predefinidas para endpoints comunes
 */
export const ENDPOINT_VALIDATORS = {
  isAuthEndpoint: createEndpointValidator(/^\/auth\//),
  isStudyGroupEndpoint: createEndpointValidator(/^\/study-groups/),
  isProfileEndpoint: createEndpointValidator(/^\/students/),
  isConversationEndpoint: createEndpointValidator(/^\/conversations/),
  isResourceEndpoint: createEndpointValidator(/^\/resources/),
  isEventEndpoint: createEndpointValidator(/^\/events/),
  isAdminEndpoint: createEndpointValidator(/^\/admin\//),
};

/**
 * Mapea un code de status HTTP a un mensaje amigable
 */
export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  200: "OK",
  201: "Creado",
  204: "Sin contenido",
  400: "Solicitud inválida",
  401: "No autorizado",
  403: "Acceso prohibido",
  404: "No encontrado",
  409: "Conflicto",
  500: "Error del servidor",
  502: "Gateway inválido",
  503: "Servicio no disponible",
};

/**
 * Obtiene un mensaje amigable para un status HTTP
 * 
 * @param status - Código HTTP
 * @returns Mensaje en español
 */
export function getStatusMessage(status: number): string {
  return HTTP_STATUS_MESSAGES[status] || `Error ${status}`;
}
