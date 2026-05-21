import type { IRecurso } from "./IRecurso.js";

export interface RecursoBaseInput {
  id: string;
  titulo: string;
  descripcion: string | null;
  url: string;
  tipo: string;
  uploaderUserId: string;
  subjectId: string;
  subjectName?: string;
  uploaderName?: string;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
}

export class RecursoBase implements IRecurso {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion: string | null;
  readonly url: string;
  readonly tipo: string;
  readonly uploaderUserId: string;
  readonly subjectId: string;
  readonly subjectName?: string;
  readonly uploaderName?: string;
  readonly ogTitle?: string | null;
  readonly ogDescription?: string | null;
  readonly ogImage?: string | null;

  constructor(input: RecursoBaseInput) {
    this.id = input.id;
    this.titulo = input.titulo;
    this.descripcion = input.descripcion;
    this.url = input.url;
    this.tipo = input.tipo;
    this.uploaderUserId = input.uploaderUserId;
    this.subjectId = input.subjectId;
    this.subjectName = input.subjectName;
    this.uploaderName = input.uploaderName;
    this.ogTitle = input.ogTitle;
    this.ogDescription = input.ogDescription;
    this.ogImage = input.ogImage;
  }

  getContenido(): string {
    return this.titulo;
  }

  getMetadata(): Record<string, unknown> {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      url: this.url,
      tipo: this.tipo,
      uploaderUserId: this.uploaderUserId,
      subjectId: this.subjectId,
      subjectName: this.subjectName,
      uploaderName: this.uploaderName,
      ogTitle: this.ogTitle,
      ogDescription: this.ogDescription,
      ogImage: this.ogImage,
    };
  }

  toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
