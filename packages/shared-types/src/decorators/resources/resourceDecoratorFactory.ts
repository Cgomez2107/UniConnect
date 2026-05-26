import { RecursoBase } from "./RecursoBase.js";
import { RecursoConEtiquetas } from "./RecursoConEtiquetas.js";
import { RecursoConValoracion } from "./RecursoConValoracion.js";
import { RecursoConComentarios } from "./RecursoConComentarios.js";
import type { IRecurso, ITag, IValoracion, IComentario } from "./IRecurso.js";
import type { RecursoBaseInput } from "./RecursoBase.js";

export interface DecoratedResourceInput extends RecursoBaseInput {
  etiquetas?: ITag[];
  valoracion?: IValoracion;
  comentarios?: IComentario[];
}

export function buildDecoratedResource(input: DecoratedResourceInput): IRecurso {
  const base = new RecursoBase(input);
  let decorated: IRecurso = base;

  if (input.etiquetas && input.etiquetas.length > 0) {
    decorated = new RecursoConEtiquetas(decorated, input.etiquetas);
  }

  if (input.valoracion) {
    decorated = new RecursoConValoracion(decorated, input.valoracion);
  }

  if (input.comentarios && input.comentarios.length > 0) {
    decorated = new RecursoConComentarios(decorated, input.comentarios);
  }

  return decorated;
}
