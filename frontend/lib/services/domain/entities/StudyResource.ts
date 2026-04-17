import { Entity } from "./Entity"

/**
 * StudyResource entity (study materials - US-006)
 * 
 * TODO: Define properties and business logic
 * - fileName: string
 * - fileUrl: string
 * - fileType: string (MIME type)
 * - fileSizeKb: number
 * - uploadedBy: UserId
 * - subject: SubjectId
 * - createdAt: Date
 */
export class StudyResource extends Entity<any> {
  toPrimitive() {
    return { id: this.id }
  }
}
