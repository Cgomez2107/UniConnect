import { ValueObject } from "./ValueObject"

/**
 * Represents event status (academic or cultural).
 */
export enum EventStatusEnum {
  SCHEDULED = "programado",
  ONGOING = "en_progreso",
  COMPLETED = "completado",
  CANCELLED = "cancelado",
}

export class EventStatus extends ValueObject<{ status: EventStatusEnum }> {
  private constructor(status: EventStatusEnum) {
    super({ status })
  }

  static scheduled(): EventStatus {
    return new EventStatus(EventStatusEnum.SCHEDULED)
  }

  static ongoing(): EventStatus {
    return new EventStatus(EventStatusEnum.ONGOING)
  }

  static completed(): EventStatus {
    return new EventStatus(EventStatusEnum.COMPLETED)
  }

  static cancelled(): EventStatus {
    return new EventStatus(EventStatusEnum.CANCELLED)
  }

  static from(value: string): EventStatus {
    // TODO: Validar
    return new EventStatus(value as EventStatusEnum)
  }

  get value(): EventStatusEnum {
    return this.props.status
  }

  equals(other: EventStatus): boolean {
    return this.props.status === other.props.status
  }

  toPrimitive(): string {
    return this.props.status
  }
}
