/**
 * ============================================================================
 * ⚠️ DEPRECATED - Este archivo está DEPRECADO
 * ============================================================================
 * 
 * RAZÓN DE DEPRECACIÓN:
 * Causaba duplicación de rutas API. Tenía baseURL con /api/v1 incluido,
 * mientras que los endpoints también incluían /api/v1, resultando en:
 *   ❌ http://localhost:3000/api/v1/api/v1/study-groups
 * 
 * SOLUCIÓN:
 * ✅ Usa: import { apiClient } from "@/lib/api/client"
 * 
 * ============================================================================
 */

// Re-export desde el nuevo archivo para retrocompatibilidad temporalmente
export { default as apiClient } from "@/lib/api/client";
export { GATEWAY_BASE_URL as API_BASE_URL } from "@/lib/api/client";

// Deprecation warning en desarrollo
if (import.meta.env.DEV && typeof window !== "undefined") {
  console.warn(
    "%c[DEPRECATION]%c httpClient.ts está deprecado.\n" +
    "Usa: %cimport { apiClient } from '@/lib/api/client'%c en su lugar.",
    "color: orange; font-weight: bold",
    "color: inherit",
    "color: green; font-weight: bold",
    "color: inherit"
  );
}
