import type { Subject } from "../../domain/entities/Subject.js";
import type { IFacultyCatalogRepository } from "../../domain/repositories/IFacultyCatalogRepository.js";

export class GetAllSubjects {
  constructor(private readonly repository: IFacultyCatalogRepository) {}

  async execute(): Promise<Subject[]> {
    return this.repository.getAllSubjects();
  }
}
