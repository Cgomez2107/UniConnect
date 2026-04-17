import type { Subject } from "@/types"
import type { IFacultyCatalogRepository } from "../../repositories/IFacultyCatalogRepository"

export class GetSubjectsByProgram {
  constructor(private repository: IFacultyCatalogRepository) {}

  async execute(programId: string): Promise<Subject[]> {
    return this.repository.getSubjectsByProgram(programId)
  }
}
