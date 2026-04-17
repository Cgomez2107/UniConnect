import { supabase } from "@/lib/supabase"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client"
import type {
  AdminEvent,
  AdminMetrics,
  AdminRequest,
  AdminResource,
  AdminUser,
  CampusEvent,
  CreateEventPayload,
  Faculty,
  Program,
  Subject,
  UserRole,
} from "@/types"
import type { IAdminPanelRepository } from "../../domain/repositories/IAdminPanelRepository"

export class SupabaseAdminPanelRepository implements IAdminPanelRepository {
  async getFaculties(): Promise<Faculty[]> {
    return apiGet<Faculty>("faculties", (q) => q.select("*").eq("is_active", true).order("name"))
  }

  async createFaculty(name: string): Promise<Faculty> {
    return apiPost<Faculty>("faculties", { name: name.trim(), code: null })
  }

  async updateFaculty(id: string, updates: { name?: string; code?: string }): Promise<Faculty> {
    return apiPatch<Faculty>(
      "faculties",
      { name: updates.name?.trim(), code: updates.code?.trim() ?? null },
      (q) => q.eq("id", id)
    )
  }

  async deleteFaculty(id: string): Promise<void> {
    await apiDelete("faculties", (q) => q.eq("id", id))
  }

  async getPrograms(): Promise<Program[]> {
    const rows = await apiGet<any>("programs", (q) => q.select("*, faculties ( name )").eq("is_active", true).order("name"))
    return rows.map((p: any) => ({ ...p, faculty_name: p.faculties?.name ?? "" })) as Program[]
  }

  async createProgram(name: string, facultyId: string): Promise<Program> {
    return apiPost<Program>("programs", {
      name: name.trim(),
      faculty_id: facultyId,
      code: null,
    })
  }

  async updateProgram(id: string, updates: { name?: string; faculty_id?: string; code?: string }): Promise<Program> {
    return apiPatch<Program>(
      "programs",
      {
        name: updates.name?.trim(),
        faculty_id: updates.faculty_id,
        code: updates.code?.trim() ?? null,
      },
      (q) => q.eq("id", id)
    )
  }

  async deleteProgram(id: string): Promise<void> {
    await apiDelete("programs", (q) => q.eq("id", id))
  }

  async getSubjects(): Promise<Subject[]> {
    const rows = await apiGet<any>("subjects", (q) =>
      q.select("*, program_subjects ( programs ( id, name, faculty_id ) )").eq("is_active", true).order("name")
    )

    return rows.map((s: any) => ({
      ...s,
      programs: (s.program_subjects ?? []).map((ps: any) => ps.programs).filter(Boolean),
      program_subjects: undefined,
    }))
  }

  async createSubject(name: string, programIds: string[]): Promise<Subject> {
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .insert({ name: name.trim(), code: null })
      .select()
      .single()

    if (subjectError) throw subjectError

    if (programIds.length > 0) {
      const links = programIds.map((pid) => ({ program_id: pid, subject_id: subject.id }))
      const { error: linkError } = await supabase.from("program_subjects").insert(links)
      if (linkError) throw linkError
    }

    return subject as Subject
  }

  async updateSubject(id: string, updates: { name?: string; code?: string }, programIds?: string[]): Promise<Subject> {
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .update({ name: updates.name?.trim(), code: updates.code?.trim() ?? null })
      .eq("id", id)
      .select()
      .single()

    if (subjectError) throw subjectError

    if (programIds !== undefined) {
      const { error: deleteError } = await supabase.from("program_subjects").delete().eq("subject_id", id)
      if (deleteError) throw deleteError

      if (programIds.length > 0) {
        const links = programIds.map((pid) => ({ program_id: pid, subject_id: id }))
        const { error: linkError } = await supabase.from("program_subjects").insert(links)
        if (linkError) throw linkError
      }
    }

    return subject as Subject
  }

  async deleteSubject(id: string): Promise<void> {
    await apiDelete("subjects", (q) => q.eq("id", id))
  }

  async getAllUsers(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_active, semester, avatar_url, created_at")
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    return (data ?? []).map((u: any) => ({
      id: u.id,
      full_name: u.full_name,
      email: "Correo no disponible",
      role: u.role,
      is_active: u.is_active,
      semester: u.semester,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
    })) as AdminUser[]
  }

  async getAllRequests(): Promise<AdminRequest[]> {
    const { data, error } = await supabase
      .from("study_requests")
      .select(
        `
      id, title, status, created_at, author_id,
      subjects ( name ),
      applications ( id )
    `
      )
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    const rows: any[] = data ?? []
    const authorIds = rows.map((r) => r.author_id).filter(Boolean)

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

  async getAllResources(): Promise<AdminResource[]> {
    const { data, error } = await supabase
      .from("study_resources")
      .select(
        `
      id, title, file_type, file_size_kb, created_at,
      profiles ( full_name ),
      subjects ( name )
    `
      )
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

  async getAdminMetrics(): Promise<AdminMetrics> {
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

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)
    if (error) throw new Error(error.message)
  }

  async toggleUserActive(userId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId)
    if (error) throw new Error(error.message)
  }

  async closeRequest(requestId: string): Promise<void> {
    const { error } = await supabase.from("study_requests").update({ status: "cerrada" }).eq("id", requestId)
    if (error) throw new Error(error.message)
  }

  async deleteRequest(requestId: string): Promise<void> {
    const { error } = await supabase.from("study_requests").delete().eq("id", requestId)
    if (error) throw new Error(error.message)
  }

  async deleteResource(resourceId: string): Promise<void> {
    const { error } = await supabase.from("study_resources").delete().eq("id", resourceId)
    if (error) throw new Error(error.message)
  }

  async getAllEvents(): Promise<AdminEvent[]> {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, event_date, location, category, created_at, creator:created_by ( full_name )")
      .order("event_date", { ascending: true })

    if (error) throw new Error(error.message)

    return (data ?? []).map((e: any) => ({
      id: e.id,
      title: e.title,
      event_date: e.event_date,
      location: e.location,
      category: e.category,
      created_at: e.created_at,
      creator_name: e.creator?.full_name ?? "Admin",
    })) as AdminEvent[]
  }

  async createEvent(payload: CreateEventPayload): Promise<CampusEvent> {
    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select("*, creator:created_by ( full_name )")
      .single()

    if (error) throw new Error(error.message)
    return data as CampusEvent
  }

  async updateEvent(id: string, payload: Partial<CreateEventPayload>): Promise<CampusEvent> {
    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", id)
      .select("*, creator:created_by ( full_name )")
      .single()

    if (error) throw new Error(error.message)
    return data as CampusEvent
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase.from("events").delete().eq("id", id)
    if (error) throw new Error(error.message)
  }
}
