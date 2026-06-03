import { RecursoDecorator } from "./RecursoDecorator.js";
import type { IValoracion } from "./IRecurso.js";

export class RecursoConValoracion extends RecursoDecorator {
  private readonly valoracion: IValoracion;

  constructor(recurso: RecursoDecorator | import("./IRecurso.js").IRecurso, valoracion: IValoracion) {
    super(recurso);
    this.valoracion = valoracion;
  }

  getValoracion(): IValoracion {
    return this.valoracion;
  }

  getContenido(): string {
    const base = this.recurso.getContenido();
    if (this.valoracion.totalVotos === 0) return `${base} [Sin valoraciones]`;
    return `${base} [★ ${this.valoracion.promedio.toFixed(1)} - ${this.valoracion.totalVotos} votos]`;
  }

  getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      tieneValoracion: this.valoracion.totalVotos > 0,
      valoracion: this.valoracion,
    };
  }
}
