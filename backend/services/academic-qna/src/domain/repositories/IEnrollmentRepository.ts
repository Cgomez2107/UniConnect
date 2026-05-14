export interface IEnrollmentRepository {
  isEnrolled(userId: string, subjectId: string): Promise<boolean>;
}
