import type {
  AdminEvent,
  AdminMetrics,
  AdminRequest,
  AdminResource,
  AdminUser,
  CampusEvent,
  CreateEventPayload,
  Faculty,
  Program,
  Subject,
  UserRole,
} from "@/types"
import type { IAdminPanelRepository } from "../../repositories/IAdminPanelRepository"

export class AdminPanelGateway {
  constructor(private repository: IAdminPanelRepository) {}

  getFaculties(): Promise<Faculty[]> {
    return this.repository.getFaculties()
  }

  createFaculty(name: string): Promise<Faculty> {
    return this.repository.createFaculty(name)
  }

  updateFaculty(id: string, updates: { name?: string; code?: string }): Promise<Faculty> {
    return this.repository.updateFaculty(id, updates)
  }

  deleteFaculty(id: string): Promise<void> {
    return this.repository.deleteFaculty(id)
  }

  getPrograms(): Promise<Program[]> {
    return this.repository.getPrograms()
  }

  createProgram(name: string, facultyId: string): Promise<Program> {
    return this.repository.createProgram(name, facultyId)
  }

  updateProgram(id: string, updates: { name?: string; faculty_id?: string; code?: string }): Promise<Program> {
    return this.repository.updateProgram(id, updates)
  }

  deleteProgram(id: string): Promise<void> {
    return this.repository.deleteProgram(id)
  }

  getSubjects(): Promise<Subject[]> {
    return this.repository.getSubjects()
  }

  createSubject(name: string, programIds: string[]): Promise<Subject> {
    return this.repository.createSubject(name, programIds)
  }

  updateSubject(id: string, updates: { name?: string; code?: string }, programIds?: string[]): Promise<Subject> {
    return this.repository.updateSubject(id, updates, programIds)
  }

  deleteSubject(id: string): Promise<void> {
    return this.repository.deleteSubject(id)
  }

  getAllUsers(): Promise<AdminUser[]> {
    return this.repository.getAllUsers()
  }

  getAllRequests(): Promise<AdminRequest[]> {
    return this.repository.getAllRequests()
  }

  getAllResources(): Promise<AdminResource[]> {
    return this.repository.getAllResources()
  }

  getAdminMetrics(): Promise<AdminMetrics> {
    return this.repository.getAdminMetrics()
  }

  updateUserRole(userId: string, role: UserRole): Promise<void> {
    return this.repository.updateUserRole(userId, role)
  }

  toggleUserActive(userId: string, isActive: boolean): Promise<void> {
    return this.repository.toggleUserActive(userId, isActive)
  }

  closeRequest(requestId: string): Promise<void> {
    return this.repository.closeRequest(requestId)
  }

  deleteRequest(requestId: string): Promise<void> {
    return this.repository.deleteRequest(requestId)
  }

  deleteResource(resourceId: string): Promise<void> {
    return this.repository.deleteResource(resourceId)
  }

  getAllEvents(): Promise<AdminEvent[]> {
    return this.repository.getAllEvents()
  }

  createEvent(payload: CreateEventPayload): Promise<CampusEvent> {
    return this.repository.createEvent(payload)
  }

  updateEvent(id: string, payload: Partial<CreateEventPayload>): Promise<CampusEvent> {
    return this.repository.updateEvent(id, payload)
  }

  deleteEvent(id: string): Promise<void> {
    return this.repository.deleteEvent(id)
  }
}
