import type { Program } from "@/types"
import type { IFacultyCatalogRepository } from "../../repositories/IFacultyCatalogRepository"

export class GetPrograms {
  constructor(private repository: IFacultyCatalogRepository) {}

  async execute(): Promise<Program[]> {
    return this.repository.getPrograms()
  }
}
