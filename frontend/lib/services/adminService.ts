// Operaciones de administración: usuarios, solicitudes, recursos y métricas.
// Acceso protegido por RLS de Supabase: solo usuarios con rol admin.

import { supabase } from "@/lib/supabase"
import type { AdminMetrics, AdminRequest, AdminResource, AdminUser, UserRole } from "@/types"

// Usuarios

export async function getAllUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, semester, avatar_url, created_at")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AdminUser[]
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
      id, title, status, modality, created_at,
      profiles ( full_name ),
      subjects ( name ),
      applications ( id )
    `)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    modality: r.modality,
    created_at: r.created_at,
    author_name: r.profiles?.full_name ?? "Desconocido",
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
