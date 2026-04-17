import { Entity } from "./Entity"

/**
 * StudyGroup entity (grupo de estudio formado)
 * 
 * TODO: Define properties and business logic
 * - name: string
 * - admin: UserId
 * - members: UserId[]
 * - subject: SubjectId
 * - createdAt: Date
 */
export class StudyGroup extends Entity<any> {
  toPrimitive() {
    return { id: this.id }
  }
}
