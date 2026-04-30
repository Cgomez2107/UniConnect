import { supabase } from "@/lib/supabase"
import { apiGet, apiPatch } from "@/lib/api/client"
import type { IStudyRequestRepository } from "../../domain/repositories/IStudyRequestRepository"
import type { StudyRequest } from "@/types"

export class SupabaseStudyRequestRepository implements IStudyRequestRepository {
  async getEnrolledSubjects(userId: string): Promise<import("@/lib/services/domain/repositories/IStudyRequestRepository").UserSubjectCatalogItem[]> {
    const { data, error } = await supabase
      .from("user_subjects")
      .select(
        `
      subject_id,
      subjects (
        id,
        name
      )
    `
      )
      .eq("user_id", userId)

    if (error) throw new Error(error.message || "No se pudieron cargar tus materias.")

    const rows: any[] = data ?? []
    const subjectRecord: Record<string, { id: string; name: string }> = {}

    for (let i = 0; i < rows.length; i++) {
      const subjectsField = rows[i].subjects
      const subjectList = Array.isArray(subjectsField) ? subjectsField : subjectsField ? [subjectsField] : []

      for (let j = 0; j < subjectList.length; j++) {
        const s = subjectList[j]
        if (!s || !s.id) continue
        const sid = String(s.id)
        if (!subjectRecord[sid]) {
          subjectRecord[sid] = { id: sid, name: String(s.name) }
        }
      }
    }

    return Object.values(subjectRecord).sort((a, b) => a.name.localeCompare(b.name))
  }

  async getAvailableSubjectsForUser(userId: string): Promise<import("@/lib/services/domain/repositories/IStudyRequestRepository").UserSubjectCatalogItem[]> {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (profileError) throw profileError

    if (profile?.role === "admin") {
      const { data, error } = await supabase.from("subjects").select("id, name").eq("is_active", true).order("name")

      if (error) throw error
      return (data ?? []) as { id: string; name: string }[]
    }

    return this.getEnrolledSubjects(userId)
  }

  async getById(id: string): Promise<StudyRequest | null> {
    const { data, error } = await supabase
      .from("study_requests")
      .select("*, subjects ( name, program_subjects ( programs ( faculties ( name ) ) ) ), profiles!study_requests_author_id_fkey ( full_name, avatar_url, bio )")
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") throw error
    if (!data) return null

    const request = data as StudyRequest
    const programSubjects = (request.subjects as any)?.program_subjects ?? []
    const firstProgram = Array.isArray(programSubjects[0]?.programs)
      ? programSubjects[0].programs[0]
      : programSubjects[0]?.programs
    const firstFaculty = Array.isArray(firstProgram?.faculties)
      ? firstProgram.faculties[0]
      : firstProgram?.faculties

    return {
      ...request,
      subject_name: request.subjects?.name ?? "Sin materia",
      faculty_name: firstFaculty?.name ?? "Sin facultad",
    }
  }

  async getFeed(filters?: { subject_id?: string; search?: string }, page = 0, pageSize = 10): Promise<StudyRequest[]> {
    let query = supabase
      .from("study_requests")
      .select("*, subjects ( name ), profiles!study_requests_author_id_fkey ( full_name, avatar_url )")
      .eq("status", "abierta")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (filters?.subject_id) query = query.eq("subject_id", filters.subject_id)
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`)

    const { data, error } = await query
    if (error) throw error

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
      subject_name: r.subjects?.name ?? "Sin materia",
      applications_count: Math.min((acceptedByRequest[r.id] ?? 0) + 1, r.max_members),
    }))
  }

  async getByAuthor(userId: string): Promise<StudyRequest[]> {
    const { data, error } = await supabase
      .from("study_requests")
      .select("*, subjects ( name ), profiles!study_requests_author_id_fkey ( full_name, avatar_url )")
      .eq("author_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error

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
      subject_name: r.subjects?.name ?? "Sin materia",
      applications_count: Math.min((acceptedByRequest[r.id] ?? 0) + 1, r.max_members),
    }))
  }

  async create(userId: string, payload: { title: string; description: string; subject_id: string; max_members: number }): Promise<StudyRequest> {
    const { data, error } = await supabase
      .from("study_requests")
      .insert({
        author_id: userId,
        title: payload.title,
        description: payload.description,
        subject_id: payload.subject_id,
        max_members: payload.max_members,
        status: "abierta",
        is_active: true,
      })
      .select("*, subjects ( name )")
      .single()

    if (error) {
      if (error.message.includes("validate_request_subject")) {
        throw new Error("Solo puedes crear solicitudes de materias que estes cursando actualmente.")
      }
      throw error
    }

    return data as StudyRequest
  }

  async updateStatus(requestId: string, status: "abierta" | "cerrada" | "expirada"): Promise<void> {
    await apiPatch<StudyRequest>("study_requests", { status }, (q) => q.eq("id", requestId))
  }

  async updateContent(requestId: string, userId: string, payload: { title?: string; description?: string }): Promise<void> {
    const { error } = await supabase.rpc("update_request_content_as_admin", {
      p_request_id: requestId,
      p_actor_user_id: userId,
      p_title: payload.title ?? null,
      p_description: payload.description ?? null,
    })

    if (error) throw new Error(error.code === "P0001" ? error.message : error.message)
  }

  async cancel(requestId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc("cancel_study_request", {
      p_request_id: requestId,
      p_actor_user_id: userId,
    })

    if (error) throw new Error(error.code === "P0001" ? error.message : error.message)
  }

  async isAdmin(requestId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("is_request_admin", {
      p_request_id: requestId,
      p_user_id: userId,
    })
    if (error) throw new Error(error.message)
    return !!data
  }

  async getAdmins(requestId: string): Promise<import("@/lib/services/domain/repositories/IStudyRequestRepository").RequestAdminEntry[]> {
    const { data, error } = await supabase.rpc("get_request_admins", {
      p_request_id: requestId,
    })
    if (error) throw new Error(error.message)
    return (data ?? []) as any[]
  }

  async assignAdmin(requestId: string, targetUserId: string, actorUserId: string): Promise<void> {
    const { error } = await supabase.rpc("assign_request_admin", {
      p_request_id: requestId,
      p_target_user_id: targetUserId,
      p_actor_user_id: actorUserId,
    })
    if (error) throw new Error(error.message)
  }

  async revokeAdmin(requestId: string, targetUserId: string, actorUserId: string): Promise<void> {
    const { error } = await supabase.rpc("revoke_request_admin", {
      p_request_id: requestId,
      p_target_user_id: targetUserId,
      p_actor_user_id: actorUserId,
    })
    if (error) throw new Error(error.message)
  }

  async countBySubject(subjectId: string): Promise<number> {
    const { count, error } = await supabase
      .from("study_requests")
      .select("*", { count: "exact", head: true })
      .eq("subject_id", subjectId)
      .eq("status", "abierta")
      .eq("is_active", true)

    if (error) throw error
    return count ?? 0
  }
}
