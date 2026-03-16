export type ApplicationStatus = "pendiente" | "aceptada" | "rechazada";

/**
 * Applications belong to the study-groups domain and are not modeled as an
 * independent microservice boundary.
 */
export interface Application {
  readonly id: string;
  readonly requestId: string;
  readonly applicantId: string;
  readonly message: string;
  readonly status: ApplicationStatus;
  readonly createdAt: string;
  readonly reviewedAt: string | null;
}