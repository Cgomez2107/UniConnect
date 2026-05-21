import { RecursoDecorator } from "./RecursoDecorator.js";
import type { ITag } from "./IRecurso.js";

export class RecursoConEtiquetas extends RecursoDecorator {
  private readonly etiquetas: ITag[];

  constructor(recurso: RecursoDecorator | import("./IRecurso.js").IRecurso, etiquetas: ITag[]) {
    super(recurso);
    this.etiquetas = etiquetas;
  }

  getEtiquetas(): ITag[] {
    return this.etiquetas;
  }

  getContenido(): string {
    const base = this.recurso.getContenido();
    if (this.etiquetas.length === 0) return base;
    const etiquetasStr = this.etiquetas.map((e) => `#${e.nombre}`).join(" ");
    return `${base} [${etiquetasStr}]`;
  }

  getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      tieneEtiquetas: this.etiquetas.length > 0,
      etiquetas: this.etiquetas,
    };
  }
}
