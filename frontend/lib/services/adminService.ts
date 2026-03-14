// Operaciones de administración: usuarios, solicitudes, recursos y métricas.
// Acceso protegido por RLS de Supabase: solo usuarios con rol admin.

import { supabase } from "@/lib/supabase"
import type { AdminMetrics, AdminRequest, AdminResource, AdminUser, UserRole } from "@/types"

// Usuarios

export async function getAllUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, semester, avatar_url, created_at")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((u: any) => ({
    id: u.id,
    full_name: u.full_name,
    // En este esquema el correo no vive en profiles.
    // Dejamos un valor amigable para que la UI no falle.
    email: "Correo no disponible",
    role: u.role,
    is_active: u.is_active,
    semester: u.semester,
    avatar_url: u.avatar_url,
    created_at: u.created_at,
  })) as AdminUser[]
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)

  if (error) throw new Error(error.message)
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId)

  if (error) throw new Error(error.message)
}

// Solicitudes

export async function getAllRequests(): Promise<AdminRequest[]> {
  const { data, error } = await supabase
    .from("study_requests")
    .select(`
      id, title, status, created_at, author_id,
      subjects ( name ),
      applications ( id )
    `)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  const rows: any[] = data ?? []
  const authorIds = rows
    .map((r) => r.author_id)
    .filter(Boolean)

  let authorsById: Record<string, { full_name: string | null }> = {}
  if (authorIds.length > 0) {
    const { data: authors, error: authorsError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds)

    if (authorsError) throw new Error(authorsError.message)

    const mapped: Record<string, { full_name: string | null }> = {}
    for (const a of authors ?? []) {
      mapped[a.id] = { full_name: a.full_name ?? null }
    }
    authorsById = mapped
  }

  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    created_at: r.created_at,
    author_name: authorsById[r.author_id]?.full_name ?? "Desconocido",
    subject_name: r.subjects?.name ?? "—",
    applications_count: Array.isArray(r.applications) ? r.applications.length : 0,
  })) as AdminRequest[]
}

export async function closeRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("study_requests")
    .update({ status: "cerrada" })
    .eq("id", requestId)

  if (error) throw new Error(error.message)
}

export async function deleteRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("study_requests")
    .delete()
    .eq("id", requestId)

  if (error) throw new Error(error.message)
}

// Recursos

export async function getAllResources(): Promise<AdminResource[]> {
  const { data, error } = await supabase
    .from("study_resources")
    .select(`
      id, title, file_type, file_size_kb, created_at,
      profiles ( full_name ),
      subjects ( name )
    `)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    file_type: r.file_type,
    file_size_kb: r.file_size_kb,
    created_at: r.created_at,
    author_name: r.profiles?.full_name ?? "Desconocido",
    subject_name: r.subjects?.name ?? "—",
  })) as AdminResource[]
}

export async function deleteResource(resourceId: string): Promise<void> {
  const { error } = await supabase
    .from("study_resources")
    .delete()
    .eq("id", resourceId)

  if (error) throw new Error(error.message)
}

// Métricas globales

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [usersRes, studentsRes, requestsRes, resourcesRes, messagesRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "estudiante").eq("is_active", true),
    supabase.from("study_requests").select("id", { count: "exact", head: true }).eq("status", "abierta"),
    supabase.from("study_resources").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
  ])

  return {
    totalUsers: usersRes.count ?? 0,
    activeStudents: studentsRes.count ?? 0,
    openRequests: requestsRes.count ?? 0,
    totalResources: resourcesRes.count ?? 0,
    totalMessages: messagesRes.count ?? 0,
  }
}
