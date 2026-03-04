/**
 * lib/services/careerService.ts
 * Solicitudes de estudio: feed, crear, postularse, gestionar
 *
 * Todas las operaciones de red fluyen por lib/api/client.ts.
 * Para migrar a microservicios, solo client.ts cambia.
 */

import { supabase } from "@/lib/supabase"
import { apiGet, apiPatch } from "@/lib/api/client"
import type { StudyRequest, Application, CreateStudyRequestPayload } from "@/types"

// ── Feed de solicitudes ───────────────────────────────────────────────────────
export async function getFeed(filters?: {
  modality?: string
  subject_id?: string
  search?: string
}): Promise<StudyRequest[]> {
  return apiGet<StudyRequest>("study_requests", (q) => {
    let query = q
      .select("*, profiles ( full_name, avatar_url ), subjects ( name )")
      .eq("status", "abierta")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    if (filters?.modality && filters.modality !== "Todos")
      query = query.eq("modality", filters.modality)
    if (filters?.subject_id)
      query = query.eq("subject_id", filters.subject_id)
    if (filters?.search)
      query = query.ilike("title", `%${filters.search}%`)
    return query
  })
}

// ── Mis solicitudes ───────────────────────────────────────────────────────────
export async function getMyRequests(userId: string): Promise<StudyRequest[]> {
  return apiGet<StudyRequest>("study_requests", (q) =>
    q
      .select("*, subjects ( name )")
      .eq("author_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
  )
}

// ── Crear solicitud ───────────────────────────────────────────────────────────
// Nota: usamos supabase directo para capturar el error del trigger
// validate_request_subject con un mensaje amigable.
export async function createRequest(
  userId: string,
  requestData: CreateStudyRequestPayload
): Promise<StudyRequest> {
  const { data, error } = await supabase
    .from("study_requests")
    .insert({ author_id: userId, ...requestData })
    .select("*, profiles ( full_name, avatar_url ), subjects ( name )")
    .single()

  if (error) {
    if (error.message.includes("validate_request_subject"))
      throw new Error("Solo puedes crear solicitudes de materias que estes cursando actualmente.")
    throw error
  }
  return data as StudyRequest
}

// ── Actualizar estado ─────────────────────────────────────────────────────────
export async function updateRequestStatus(
  requestId: string,
  status: "abierta" | "cerrada" | "expirada"
): Promise<void> {
  await apiPatch<StudyRequest>("study_requests", { status }, (q) => q.eq("id", requestId))
}

// ── Postularse ────────────────────────────────────────────────────────────────
// Supabase directo para capturar el unique violation (23505)
export async function applyToRequest(
  requestId: string,
  applicantId: string,
  message: string
): Promise<Application> {
  const { data, error } = await supabase
    .from("applications")
    .insert({
      request_id: requestId,
      applicant_id: applicantId,
      message: message.trim(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") throw new Error("Ya te postulaste a esta solicitud.")
    throw error
  }
  return data as Application
}

// ── Postulaciones recibidas ───────────────────────────────────────────────────
export async function getApplicationsForRequest(requestId: string): Promise<Application[]> {
  return apiGet<Application>("applications", (q) =>
    q
      .select("*, profiles ( full_name, avatar_url )")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
  )
}

// ── Mis postulaciones enviadas ────────────────────────────────────────────────
export async function getMyApplications(userId: string): Promise<Application[]> {
  return apiGet<Application>("applications", (q) =>
    q
      .select("*, study_requests ( title, status, subjects ( name ) )")
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false })
  )
}

// ── Aceptar / rechazar postulacion ────────────────────────────────────────────
export async function reviewApplication(
  applicationId: string,
  status: "aceptada" | "rechazada"
): Promise<void> {
  await apiPatch<Application>(
    "applications",
    { status, reviewed_at: new Date().toISOString() },
    (q) => q.eq("id", applicationId)
  )
}

// ── Postulaciones RECIBIDAS en todas mis solicitudes ──────────────────────────
// Para el tab "Solicitudes" del autor — US-010
export async function getReceivedApplications(userId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      profiles ( full_name, avatar_url ),
      study_requests!inner ( id, title, author_id, subjects ( name ) )
    `)
    .eq("study_requests.author_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Application[];
}

// ── Verificar si el usuario tiene una postulación aceptada a un request ───────
// Usado en solicitud/[id].tsx para mostrar u ocultar el botón de chat — US-011
export async function getMyApplicationStatus(
  requestId: string,
  userId: string
): Promise<"pendiente" | "aceptada" | "rechazada" | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("status")
    .eq("request_id", requestId)
    .eq("applicant_id", userId)
    .maybeSingle();

  if (error) return null;
  return (data?.status ?? null) as "pendiente" | "aceptada" | "rechazada" | null;
}