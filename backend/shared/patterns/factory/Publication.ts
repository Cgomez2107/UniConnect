/**
 * Publicación Base - Contrato que todos los tipos deben cumplir
 * 
 * Factory Method Pattern: Cada tipo de publicación tiene su propia lógica
 * de validación y visualización, pero todas comparten el método publicar()
 */

export interface PublicationMetadata {
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  views: number;
  isActive: boolean;
}

export abstract class Publication {
  protected id: string;
  protected title: string;
  protected description: string;
  protected metadata: PublicationMetadata;

  constructor(
    id: string,
    title: string,
    description: string,
    authorId: string
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId,
      views: 0,
      isActive: true,
    };
  }

  /**
   * Validar datos según el tipo de publicación
   * Método abstracto: cada subclase implementa su propia lógica
   */
  abstract validate(): { valid: boolean; errors: string[] };

  /**
   * Get tipo de publicación (usado por Factory)
   */
  abstract getType(): string;

  /**
   * Get campos específicos del tipo (para visualización en frontend)
   */
  abstract getSpecificFields(): Record<string, any>;

  /**
   * Publicar la publicación
   * Método común a todas las publicaciones
   */
  public publish(): { success: boolean; publicationId: string } {
    const { valid, errors } = this.validate();

    if (!valid) {
      throw new Error(`Validación fallida: ${errors.join(', ')}`);
    }

    this.metadata.isActive = true;
    return {
      success: true,
      publicationId: this.id,
    };
  }

  /**
   * Método para obtener representación completa
   */
  public toJSON() {
    return {
      id: this.id,
      type: this.getType(),
      title: this.title,
      description: this.description,
      metadata: this.metadata,
      specificFields: this.getSpecificFields(),
    };
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getTitle(): string {
    return this.title;
  }

  public getDescription(): string {
    return this.description;
  }

  public getMetadata(): PublicationMetadata {
    return this.metadata;
  }
}

export default Publication;
