import type { IRecurso } from "./IRecurso.js";

export abstract class RecursoDecorator implements IRecurso {
  protected readonly recurso: IRecurso;

  constructor(recurso: IRecurso) {
    this.recurso = recurso;
  }

  get id(): string {
    return this.recurso.id;
  }

  get titulo(): string {
    return this.recurso.titulo;
  }

  get descripcion(): string | null {
    return this.recurso.descripcion;
  }

  get url(): string {
    return this.recurso.url;
  }

  get tipo(): string {
    return this.recurso.tipo;
  }

  get uploaderUserId(): string {
    return this.recurso.uploaderUserId;
  }

  get subjectId(): string {
    return this.recurso.subjectId;
  }

  get subjectName(): string | undefined {
    return this.recurso.subjectName;
  }

  get uploaderName(): string | undefined {
    return this.recurso.uploaderName;
  }

  get ogTitle(): string | null | undefined {
    return this.recurso.ogTitle;
  }

  get ogDescription(): string | null | undefined {
    return this.recurso.ogDescription;
  }

  get ogImage(): string | null | undefined {
    return this.recurso.ogImage;
  }

  getContenido(): string {
    return this.recurso.getContenido();
  }

  getMetadata(): Record<string, unknown> {
    return { ...this.recurso.getMetadata() };
  }

  toJSON(): Record<string, unknown> {
    return this.getMetadata();
  }
}
