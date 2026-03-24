import { apiGet } from "@/lib/api/client"
import type { Program, Subject } from "@/types"
import type { IFacultyCatalogRepository } from "../../domain/repositories/IFacultyCatalogRepository"

export class SupabaseFacultyCatalogRepository implements IFacultyCatalogRepository {
  async getPrograms(_facultyId?: string): Promise<Program[]> {
    const rows = await apiGet<any>("programs", (q) =>
      q.select("*, faculties ( name )").eq("is_active", true).order("name")
    )

    return rows.map((p: any) => ({ ...p, faculty_name: p.faculties?.name ?? "" })) as Program[]
  }

  async getSubjectsByProgram(programId: string): Promise<Subject[]> {
    const rows = await apiGet<any>("program_subjects", (q) => q.select("subjects ( * )").eq("program_id", programId))
    return rows.map((ps: any) => ps.subjects).filter(Boolean)
  }

  async getFaculties(): Promise<any[]> {
    throw new Error("Not implemented in Supabase fallback")
  }

  async getAllSubjects(): Promise<Subject[]> {
    throw new Error("Not implemented in Supabase fallback")
  }

  async getSubjectById(_subjectId: string): Promise<Subject | null> {
    throw new Error("Not implemented in Supabase fallback")
  }
}
