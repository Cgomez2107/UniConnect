import { RecursoDecorator } from "./RecursoDecorator.js";
import type { IComentario } from "./IRecurso.js";

export class RecursoConComentarios extends RecursoDecorator {
  private readonly comentarios: IComentario[];

  constructor(recurso: RecursoDecorator | import("./IRecurso.js").IRecurso, comentarios: IComentario[]) {
    super(recurso);
    this.comentarios = comentarios;
  }

  getComentarios(): IComentario[] {
    return this.comentarios;
  }

  getContenido(): string {
    const base = this.recurso.getContenido();
    const count = this.comentarios.length;
    if (count === 0) return `${base} [Sin comentarios]`;
    return `${base} [${count} comentario${count !== 1 ? "s" : ""}]`;
  }

  getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      tieneComentarios: this.comentarios.length > 0,
      comentarios: this.comentarios,
      comentariosCount: this.comentarios.length,
    };
  }
}
