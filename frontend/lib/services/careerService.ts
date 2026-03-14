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
  subject_id?: string
  search?: string
}): Promise<StudyRequest[]> {
  return apiGet<StudyRequest>("study_requests", (q) => {
    let query = q
      .select("*, subjects ( name )")
      .eq("status", "abierta")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    if (filters?.subject_id)
      query = query.eq("subject_id", filters.subject_id)
    if (filters?.search)
      query = query.ilike("title", `%${filters.search}%`)
    return query
  })
}

// ── Mis solicitudes ───────────────────────────────────────────────────────────
export async function getMyRequests(userId: string): Promise<StudyRequest[]> {
  const { data, error } = await supabase
    .from("study_requests")
    .select("*, subjects ( name )")
    .eq("author_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  const requests = (data ?? []) as StudyRequest[]
  if (requests.length === 0) return requests

  const requestIds = requests.map((r) => r.id)
  const acceptedByRequest: Record<string, number> = {}

  const { data: acceptedRows, error: acceptedErr } = await supabase
    .from("applications")
    .select("request_id")
    .in("request_id", requestIds)
    .eq("status", "aceptada")

  if (!acceptedErr) {
    const rows: any[] = acceptedRows ?? []
    for (let i = 0; i < rows.length; i++) {
      const reqId = String(rows[i].request_id ?? "")
      if (!reqId) continue
      acceptedByRequest[reqId] = (acceptedByRequest[reqId] ?? 0) + 1
    }
  }

  return requests.map((r) => ({
    ...r,
    applications_count: Math.min((acceptedByRequest[r.id] ?? 0) + 1, r.max_members),
  }))
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
    .select("*, subjects ( name )")
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
    if (error.code === "P0001") throw new Error(error.message)
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
  reviewerId: string,
  applicationId: string,
  status: "aceptada" | "rechazada"
): Promise<void> {
  const { error } = await supabase.rpc("review_application_as_author", {
    p_application_id: applicationId,
    p_reviewer_id: reviewerId,
    p_status: status,
  })

  if (error) {
    if (error.code === "P0001") {
      throw new Error(error.message)
    }
    throw error
  }
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

// ── Admins de solicitud (autor + admins asignados) ──────────────────────────
export async function isRequestAdmin(requestId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_request_admin", {
    p_request_id: requestId,
    p_user_id: userId,
  })

  if (error) throw error
  return !!data
}

export async function getRequestAdmins(requestId: string): Promise<Array<{
  user_id: string
  full_name: string
  avatar_url: string | null
  granted_by: string
  created_at: string
}>> {
  const { data, error } = await supabase.rpc("get_request_admins", {
    p_request_id: requestId,
  })

  if (error) throw error
  return (data ?? []) as Array<{
    user_id: string
    full_name: string
    avatar_url: string | null
    granted_by: string
    created_at: string
  }>
}

export async function assignRequestAdmin(
  requestId: string,
  targetUserId: string,
  actorUserId: string
): Promise<void> {
  const { error } = await supabase.rpc("assign_request_admin", {
    p_request_id: requestId,
    p_target_user_id: targetUserId,
    p_actor_user_id: actorUserId,
  })

  if (error) {
    if (error.code === "P0001") throw new Error(error.message)
    throw error
  }
}

export async function revokeRequestAdmin(
  requestId: string,
  targetUserId: string,
  actorUserId: string
): Promise<void> {
  const { error } = await supabase.rpc("revoke_request_admin", {
    p_request_id: requestId,
    p_target_user_id: targetUserId,
    p_actor_user_id: actorUserId,
  })

  if (error) {
    if (error.code === "P0001") throw new Error(error.message)
    throw error
  }
}

// ── Edicion y cancelacion de solicitud/postulacion ───────────────────────────
export async function updateRequestContentAsAdmin(
  requestId: string,
  actorUserId: string,
  payload: { title?: string; description?: string }
): Promise<void> {
  const { error } = await supabase.rpc("update_request_content_as_admin", {
    p_request_id: requestId,
    p_actor_user_id: actorUserId,
    p_title: payload.title ?? null,
    p_description: payload.description ?? null,
  })

  if (error) {
    if (error.code === "P0001") throw new Error(error.message)
    throw error
  }
}

export async function cancelStudyRequest(
  requestId: string,
  actorUserId: string
): Promise<void> {
  const { error } = await supabase.rpc("cancel_study_request", {
    p_request_id: requestId,
    p_actor_user_id: actorUserId,
  })

  if (error) {
    if (error.code === "P0001") throw new Error(error.message)
    throw error
  }
}

export async function cancelMyApplication(
  requestId: string,
  actorUserId: string
): Promise<void> {
  const { error } = await supabase.rpc("cancel_my_application", {
    p_request_id: requestId,
    p_actor_user_id: actorUserId,
  })

  if (error) {
    if (error.code === "P0001") throw new Error(error.message)
    throw error
  }
}