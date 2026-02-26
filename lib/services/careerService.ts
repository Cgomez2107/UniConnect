/**
 * lib/services/careerService.ts
 * Solicitudes de estudio: feed, crear, postularse, gestionar
 */

import { supabase } from "@/lib/supabase"

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface StudyRequest {
  id: string
  author_id: string
  subject_id: string
  title: string
  description: string
  modality: "presencial" | "virtual" | "hibrido"
  max_members: number
  status: "abierta" | "cerrada" | "expirada"
  is_active: boolean
  created_at: string
  updated_at: string
  // joins
  profiles?: { full_name: string; avatar_url: string | null }
  subjects?: { name: string }
  applications_count?: number
}

export interface CreateRequestData {
  subject_id: string
  title: string
  description: string
  modality: "presencial" | "virtual" | "hibrido"
  max_members: number
}

export interface Application {
  id: string
  request_id: string
  applicant_id: string
  message: string
  status: "pendiente" | "aceptada" | "rechazada"
  reviewed_at: string | null
  created_at: string
  // join
  profiles?: { full_name: string; avatar_url: string | null }
}

// ── Feed de solicitudes ───────────────────────────────────────────────────────
// Trae todas las solicitudes abiertas con autor y materia
export async function getFeed(filters?: {
  modality?: string
  subject_id?: string
  search?: string
}): Promise<StudyRequest[]> {
  let query = supabase
    .from("study_requests")
    .select(`
      *,
      profiles ( full_name, avatar_url ),
      subjects ( name )
    `)
    .eq("status", "abierta")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (filters?.modality && filters.modality !== "Todos") {
    query = query.eq("modality", filters.modality)
  }

  if (filters?.subject_id) {
    query = query.eq("subject_id", filters.subject_id)
  }

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ── Mis solicitudes ───────────────────────────────────────────────────────────
export async function getMyRequests(userId: string): Promise<StudyRequest[]> {
  const { data, error } = await supabase
    .from("study_requests")
    .select(`
      *,
      subjects ( name )
    `)
    .eq("author_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

// ── Crear solicitud ───────────────────────────────────────────────────────────
export async function createRequest(
  userId: string,
  requestData: CreateRequestData
): Promise<StudyRequest> {
  const { data, error } = await supabase
    .from("study_requests")
    .insert({
      author_id: userId,
      ...requestData,
    })
    .select(`
      *,
      profiles ( full_name, avatar_url ),
      subjects ( name )
    `)
    .single()

  if (error) {
    // El trigger lanza error si el usuario no cursa la materia
    if (error.message.includes("validate_request_subject")) {
      throw new Error("Solo puedes crear solicitudes de materias que estés cursando actualmente.")
    }
    throw error
  }

  return data
}

// ── Actualizar estado de solicitud ────────────────────────────────────────────
export async function updateRequestStatus(
  requestId: string,
  status: "abierta" | "cerrada" | "expirada"
): Promise<void> {
  const { error } = await supabase
    .from("study_requests")
    .update({ status })
    .eq("id", requestId)

  if (error) throw error
}

// ── Postularse a una solicitud ────────────────────────────────────────────────
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
    if (error.code === "23505") { // unique violation
      throw new Error("Ya te postulaste a esta solicitud.")
    }
    throw error
  }

  return data
}

// ── Postulaciones recibidas en mis solicitudes ────────────────────────────────
export async function getApplicationsForRequest(
  requestId: string
): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      profiles ( full_name, avatar_url )
    `)
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

// ── Mis postulaciones enviadas ────────────────────────────────────────────────
export async function getMyApplications(userId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      study_requests ( title, status, subjects ( name ) )
    `)
    .eq("applicant_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

// ── Responder postulación (aceptar o rechazar) ────────────────────────────────
export async function reviewApplication(
  applicationId: string,
  status: "aceptada" | "rechazada"
): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId)

  if (error) throw error
}