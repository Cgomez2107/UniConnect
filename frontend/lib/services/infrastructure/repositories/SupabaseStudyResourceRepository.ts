import { supabase } from "@/lib/supabase"
import { apiDelete, apiGet } from "@/lib/api/client"
import type { IStudyResourceRepository } from "../../domain/repositories/IStudyResourceRepository"
import type { StudyResource } from "@/types"

/**
 * Supabase implementation of IStudyResourceRepository.
 * Handles database operations for study resources (US-006).
 */
export class SupabaseStudyResourceRepository implements IStudyResourceRepository {
  async getById(id: string): Promise<StudyResource | null> {
    const { data, error } = await supabase
      .from("study_resources")
      .select("*, profiles ( full_name, avatar_url )")
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data ?? null
  }

  async getBySubject(subjectId: string): Promise<StudyResource[]> {
    return apiGet<StudyResource>("study_resources", (q) =>
      q
        .select("*, profiles ( full_name, avatar_url )")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false })
    )
  }

  async getByUser(userId: string): Promise<StudyResource[]> {
    return apiGet<StudyResource>("study_resources", (q) =>
      q
        .select("*, profiles ( full_name, avatar_url )")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
    )
  }

  async create(
    userId: string,
    programId: string,
    payload: { subject_id: string; title: string; description?: string; file_url: string; file_name: string; file_type?: string; file_size_kb?: number }
  ): Promise<StudyResource> {
    const { data, error } = await supabase
      .from("study_resources")
      .insert({
        user_id: userId,
        program_id: programId,
        subject_id: payload.subject_id,
        title: payload.title,
        description: payload.description ?? null,
        file_url: payload.file_url,
        file_name: payload.file_name,
        file_type: payload.file_type ?? null,
        file_size_kb: payload.file_size_kb ?? null,
      })
      .select("*, profiles ( full_name, avatar_url )")
      .single()

    if (error) throw error
    return data as StudyResource
  }

  async update(resourceId: string, userId: string, payload: { title?: string; description?: string | null }): Promise<StudyResource> {
    const { data, error } = await supabase
      .from("study_resources")
      .update({
        title: payload.title,
        description: payload.description ?? null,
      })
      .eq("id", resourceId)
      .eq("user_id", userId)
      .select("*, profiles ( full_name, avatar_url ), subjects ( name )")
      .single()

    if (error) throw error
    return data as StudyResource
  }

  async delete(resourceId: string, userId: string): Promise<void> {
    const { error: fetchError } = await supabase
      .from("study_resources")
      .select("user_id")
      .eq("id", resourceId)
      .single()

    if (fetchError) throw fetchError

    await apiDelete("study_resources", (q) => q.eq("id", resourceId).eq("user_id", userId))
  }
}
