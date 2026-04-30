import type { Application } from "@/types"

export interface IApplicationRepository {
  getById(id: string): Promise<Application | null>
  getByRequest(requestId: string): Promise<Application[]>
  getByApplicant(applicantId: string): Promise<Application[]>
  create(requestId: string, applicantId: string, message: string, applicantName?: string): Promise<Application>
  update(applicationId: string, status: "pendiente" | "aceptada" | "rechazada"): Promise<void>
  delete(id: string): Promise<void>
  getReceivedByAuthor(authorId: string): Promise<Application[]>
  getMyApplicationStatus(requestId: string, userId: string): Promise<"pendiente" | "aceptada" | "rechazada" | null>
  cancel(requestId: string, userId: string): Promise<void>
}
