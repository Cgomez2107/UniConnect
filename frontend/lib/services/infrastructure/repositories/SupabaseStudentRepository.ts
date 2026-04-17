import { supabase } from "@/lib/supabase"
import type { StudentPublicProfile, StudentSearchResult } from "@/types"
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository"

const DEFAULT_PAGE_SIZE = 20

export class SupabaseStudentRepository implements IStudentRepository {
  async searchBySubject(
    subjectId: string,
    currentUserId: string,
    page = 0,
    pageSize = DEFAULT_PAGE_SIZE
  ): Promise<StudentSearchResult[]> {
    const { data, error } = await supabase.rpc("search_students_by_subject", {
      p_subject_id: subjectId,
      p_user_id: currentUserId,
      p_limit: pageSize,
      p_offset: page * pageSize,
    })

    if (error) throw new Error(`Error al buscar estudiantes: ${error.message}`)
    return (data ?? []) as StudentSearchResult[]
  }

  async getPublicProfile(studentId: string, currentUserId: string): Promise<StudentPublicProfile | null> {
    const [profileResult, targetSubjectsResult, mySubjectsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, semester")
        .eq("id", studentId)
        .eq("is_active", true)
        .single(),
      supabase
        .from("user_subjects")
        .select("subject_id, subjects ( id, name )")
        .eq("user_id", studentId),
      supabase.from("user_subjects").select("subject_id").eq("user_id", currentUserId),
    ])

    if (profileResult.error || !profileResult.data) return null

    const { data: programData } = await supabase
      .from("user_programs")
      .select("is_primary, programs ( name, faculties ( name ) )")
      .eq("user_id", studentId)
      .order("is_primary", { ascending: false })
      .limit(1)

    const mySubjectIds: string[] = []
    const myRows: any[] = mySubjectsResult.data ?? []
    for (let i = 0; i < myRows.length; i++) {
      mySubjectIds.push(myRows[i].subject_id)
    }

    const sharedSubjects: { id: string; name: string }[] = []
    const targetRows: any[] = targetSubjectsResult.data ?? []
    for (let i = 0; i < targetRows.length; i++) {
      const row = targetRows[i]
      if (mySubjectIds.indexOf(row.subject_id) !== -1) {
        const subjectData = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects
        if (subjectData) {
          sharedSubjects.push({
            id: String(subjectData.id),
            name: String(subjectData.name),
          })
        }
      }
    }

    let programName: string | null = null
    let facultyName: string | null = null
    const progRows: any[] = programData ?? []
    if (progRows.length > 0) {
      const prog = Array.isArray(progRows[0].programs) ? progRows[0].programs[0] : progRows[0].programs
      programName = prog?.name ?? null
      const fac = Array.isArray(prog?.faculties) ? prog.faculties[0] : prog?.faculties
      facultyName = fac?.name ?? null
    }

    const profile = profileResult.data

    return {
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      semester: profile.semester,
      program_name: programName,
      faculty_name: facultyName,
      shared_subjects: sharedSubjects,
    }
  }
}
