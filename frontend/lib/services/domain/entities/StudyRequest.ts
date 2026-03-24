import { Entity } from "./Entity"

/**
 * StudyRequest entity
 * 
 * TODO: Define properties and business logic
 * - title: string
 * - description: string
 * - author: UserId
 * - subject: Subject
 * - status: RequestStatus
 * - maxMembers: number
 * - createdAt: Date
 * - modality: Modality
 */
export class StudyRequest extends Entity<any> {
  toPrimitive() {
    return { id: this.id }
  }
}
