import type { Program, Subject } from "@/types"

export interface IFacultyCatalogRepository {
  getPrograms(facultyId?: string): Promise<Program[]>
  getSubjectsByProgram(programId: string): Promise<Subject[]>
  getFaculties(): Promise<any[]>
  getAllSubjects(): Promise<Subject[]>
  getSubjectById(subjectId: string): Promise<Subject | null>
}
