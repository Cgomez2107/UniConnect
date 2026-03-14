import { ValueObject } from "./ValueObject"

/**
 * Represents application status (to a study request).
 */
export enum ApplicationStatusEnum {
  PENDING = "pendiente",
  ACCEPTED = "aceptada",
  REJECTED = "rechazada",
}

export class ApplicationStatus extends ValueObject<{ status: ApplicationStatusEnum }> {
  private constructor(status: ApplicationStatusEnum) {
    super({ status })
  }

  static pending(): ApplicationStatus {
    return new ApplicationStatus(ApplicationStatusEnum.PENDING)
  }

  static accepted(): ApplicationStatus {
    return new ApplicationStatus(ApplicationStatusEnum.ACCEPTED)
  }

  static rejected(): ApplicationStatus {
    return new ApplicationStatus(ApplicationStatusEnum.REJECTED)
  }

  static from(value: string): ApplicationStatus {
    // TODO: Validar
    return new ApplicationStatus(value as ApplicationStatusEnum)
  }

  get value(): ApplicationStatusEnum {
    return this.props.status
  }

  isPending(): boolean {
    return this.props.status === ApplicationStatusEnum.PENDING
  }

  isAccepted(): boolean {
    return this.props.status === ApplicationStatusEnum.ACCEPTED
  }

  isRejected(): boolean {
    return this.props.status === ApplicationStatusEnum.REJECTED
  }

  equals(other: ApplicationStatus): boolean {
    return this.props.status === other.props.status
  }

  toPrimitive(): string {
    return this.props.status
  }
}
