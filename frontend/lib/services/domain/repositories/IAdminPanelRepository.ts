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

export interface IAdminPanelRepository {
  getFaculties(): Promise<Faculty[]>
  createFaculty(name: string): Promise<Faculty>
  updateFaculty(id: string, updates: { name?: string; code?: string }): Promise<Faculty>
  deleteFaculty(id: string): Promise<void>

  getPrograms(): Promise<Program[]>
  createProgram(name: string, facultyId: string): Promise<Program>
  updateProgram(id: string, updates: { name?: string; faculty_id?: string; code?: string }): Promise<Program>
  deleteProgram(id: string): Promise<void>

  getSubjects(): Promise<Subject[]>
  createSubject(name: string, programIds: string[]): Promise<Subject>
  updateSubject(id: string, updates: { name?: string; code?: string }, programIds?: string[]): Promise<Subject>
  deleteSubject(id: string): Promise<void>

  getAllUsers(): Promise<AdminUser[]>
  getAllRequests(): Promise<AdminRequest[]>
  getAllResources(): Promise<AdminResource[]>
  getAdminMetrics(): Promise<AdminMetrics>
  updateUserRole(userId: string, role: UserRole): Promise<void>
  toggleUserActive(userId: string, isActive: boolean): Promise<void>
  closeRequest(requestId: string): Promise<void>
  deleteRequest(requestId: string): Promise<void>
  deleteResource(resourceId: string): Promise<void>

  getAllEvents(): Promise<AdminEvent[]>
  createEvent(payload: CreateEventPayload): Promise<CampusEvent>
  updateEvent(id: string, payload: Partial<CreateEventPayload>): Promise<CampusEvent>
  deleteEvent(id: string): Promise<void>
}
