import { ValueObject } from "./ValueObject"

/**
 * Represents study modality (presencial, virtual, híbrido).
 */
export enum ModalityEnum {
  PRESENCIAL = "presencial",
  VIRTUAL = "virtual",
  HIBRIDO = "hibrido",
}

export class Modality extends ValueObject<{ modality: ModalityEnum }> {
  private constructor(modality: ModalityEnum) {
    super({ modality })
  }

  static presencial(): Modality {
    return new Modality(ModalityEnum.PRESENCIAL)
  }

  static virtual(): Modality {
    return new Modality(ModalityEnum.VIRTUAL)
  }

  static hibrido(): Modality {
    return new Modality(ModalityEnum.HIBRIDO)
  }

  static from(value: string): Modality {
    // TODO: Normalizar y validar (híbrido → hibrido)
    return new Modality(value as ModalityEnum)
  }

  get value(): ModalityEnum {
    return this.props.modality
  }

  equals(other: Modality): boolean {
    return this.props.modality === other.props.modality
  }

  toPrimitive(): string {
    return this.props.modality
  }
}
