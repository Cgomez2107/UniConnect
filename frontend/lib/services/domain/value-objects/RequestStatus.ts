import { ValueObject } from "./ValueObject"

/**
 * Represents study request status.
 */
export enum RequestStatusEnum {
  OPEN = "abierta",
  CLOSED = "cerrada",
  EXPIRED = "expirada",
}

export class RequestStatus extends ValueObject<{ status: RequestStatusEnum }> {
  private constructor(status: RequestStatusEnum) {
    super({ status })
  }

  static open(): RequestStatus {
    return new RequestStatus(RequestStatusEnum.OPEN)
  }

  static closed(): RequestStatus {
    return new RequestStatus(RequestStatusEnum.CLOSED)
  }

  static expired(): RequestStatus {
    return new RequestStatus(RequestStatusEnum.EXPIRED)
  }

  static from(value: string): RequestStatus {
    // TODO: Validar que value esté en RequestStatusEnum
    return new RequestStatus(value as RequestStatusEnum)
  }

  get value(): RequestStatusEnum {
    return this.props.status
  }

  equals(other: RequestStatus): boolean {
    return this.props.status === other.props.status
  }

  toPrimitive(): string {
    return this.props.status
  }
}
