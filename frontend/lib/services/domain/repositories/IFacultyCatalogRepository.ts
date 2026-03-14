import type { Program, Subject } from "@/types"

export interface IFacultyCatalogRepository {
  getPrograms(): Promise<Program[]>
  getSubjectsByProgram(programId: string): Promise<Subject[]>
}
