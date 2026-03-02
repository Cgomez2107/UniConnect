/**
 * lib/api/client.ts
 *
 * Capa de abstracción sobre Supabase.
 *
 * ¿Por qué existe este archivo?
 * Hoy el backend es Supabase directamente. Mañana puede ser un microservicio
 * propio desplegado en Supabase Edge Functions o en cualquier servidor REST.
 * Esta capa garantiza que todas las pantallas y servicios NO dependen de un
 * proveedor específico — solo de esta interfaz.
 *
 * Para migrar a microservicios:
 *   1. Cambia `supabaseGet`, `supabasePost`, etc. para que llamen a tu API Gateway.
 *   2. Las pantallas y hooks no necesitan ningún cambio.
 *
 * Uso:
 *   import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api/client"
 */

import { supabase } from "@/lib/supabase"

// ── Tipos base ────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error: string | null
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function handleError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message)
  }
  return "Error desconocido"
}

// ── Operaciones sobre tablas de Supabase ──────────────────────────────────────

/**
 * Leer registros de una tabla.
 * @param table  Nombre de la tabla
 * @param query  Función que recibe el query builder y lo personaliza (filtros, joins, orden)
 */
// Tipo de callback permisivo: el builder de Supabase devuelve varios subtipos
// (QueryBuilder, FilterBuilder, etc.) según las operaciones encadenadas.
// Usamos `any` en ambos lados del callback porque los subtipos no son
// asignables entre sí en el sistema de tipos de @supabase/supabase-js.
type QueryFn = (q: any) => any

export async function apiGet<T>(
  table: string,
  query: QueryFn
): Promise<T[]> {
  const base = supabase.from(table)
  const { data, error } = await (query(base) as any)
  if (error) throw new Error(handleError(error))
  return (data ?? []) as T[]
}

/**
 * Leer un único registro.
 */
export async function apiGetOne<T>(
  table: string,
  query: QueryFn
): Promise<T | null> {
  const base = supabase.from(table)
  const { data, error } = await (query(base) as any)
  if (error) throw new Error(handleError(error))
  return (data ?? null) as T | null
}

/**
 * Insertar un registro.
 */
export async function apiPost<T>(
  table: string,
  payload: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(handleError(error))
  return data as T
}

/**
 * Actualizar registros.
 */
export async function apiPatch<T>(
  table: string,
  payload: Record<string, unknown>,
  query: QueryFn
): Promise<T> {
  const base = supabase.from(table).update(payload)
  const { data, error } = await (query(base as any) as any).select().single()
  if (error) throw new Error(handleError(error))
  return data as T
}

/**
 * Eliminar registros.
 */
export async function apiDelete(
  table: string,
  query: QueryFn
): Promise<void> {
  // .delete() primero para obtener un FilterBuilder (tiene .eq())
  const base = supabase.from(table).delete()
  const { error } = await (query(base) as any)
  if (error) throw new Error(handleError(error))
}

// ── Acceso directo a Supabase Auth (permanece aquí para no duplicar) ───────────
// Cuando migres Auth a un microservicio propio, solo cambia este bloque.
export { supabase }
