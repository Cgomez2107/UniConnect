import { supabase } from "@/lib/supabase"
import { apiGet } from "@/lib/api/client"
import type { IApplicationRepository } from "../../domain/repositories/IApplicationRepository"
import type { Application } from "@/types"

export class SupabaseApplicationRepository implements IApplicationRepository {
  async getById(id: string): Promise<Application | null> {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data ?? null
  }

  async getByRequest(requestId: string): Promise<Application[]> {
    return apiGet<Application>("applications", (q) =>
      q
        .select("*, profiles ( full_name, avatar_url )")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false })
    )
  }

  async getByApplicant(applicantId: string): Promise<Application[]> {
    return apiGet<Application>("applications", (q) =>
      q
        .select("*, study_requests ( title, status, subjects ( name ) )")
        .eq("applicant_id", applicantId)
        .order("created_at", { ascending: false })
    )
  }

  async create(requestId: string, applicantId: string, message: string): Promise<Application> {
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

  async update(applicationId: string, status: "pendiente" | "aceptada" | "rechazada"): Promise<void> {
    const { error } = await supabase.rpc("review_application_as_author", {
      p_application_id: applicationId,
      p_status: status,
    })

    if (error) throw new Error(error.code === "P0001" ? error.message : error.message)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("applications").delete().eq("id", id)
    if (error) throw error
  }

  async getReceivedByAuthor(authorId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        profiles ( full_name, avatar_url ),
        study_requests!inner ( id, title, author_id, subjects ( name ) )
      `)
      .eq("study_requests.author_id", authorId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data ?? []) as Application[]
  }

  async getMyApplicationStatus(requestId: string, userId: string): Promise<"pendiente" | "aceptada" | "rechazada" | null> {
    const { data, error } = await supabase
      .from("applications")
      .select("status")
      .eq("request_id", requestId)
      .eq("applicant_id", userId)
      .maybeSingle()

    if (error) return null
    return (data?.status ?? null) as "pendiente" | "aceptada" | "rechazada" | null
  }

  async cancel(requestId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc("cancel_my_application", {
      p_request_id: requestId,
      p_actor_user_id: userId,
    })

    if (error) throw new Error(error.code === "P0001" ? error.message : error.message)
  }
}
