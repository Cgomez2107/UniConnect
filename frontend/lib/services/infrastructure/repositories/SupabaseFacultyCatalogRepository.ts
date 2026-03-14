import { apiGet } from "@/lib/api/client"
import type { Program, Subject } from "@/types"
import type { IFacultyCatalogRepository } from "../../domain/repositories/IFacultyCatalogRepository"

export class SupabaseFacultyCatalogRepository implements IFacultyCatalogRepository {
  async getPrograms(): Promise<Program[]> {
    const rows = await apiGet<any>("programs", (q) =>
      q.select("*, faculties ( name )").eq("is_active", true).order("name")
    )

    return rows.map((p: any) => ({ ...p, faculty_name: p.faculties?.name ?? "" })) as Program[]
  }

  async getSubjectsByProgram(programId: string): Promise<Subject[]> {
    const rows = await apiGet<any>("program_subjects", (q) => q.select("subjects ( * )").eq("program_id", programId))
    return rows.map((ps: any) => ps.subjects).filter(Boolean)
  }
}
