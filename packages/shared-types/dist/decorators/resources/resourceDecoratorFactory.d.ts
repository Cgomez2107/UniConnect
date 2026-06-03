import type { IRecurso, ITag, IValoracion, IComentario } from "./IRecurso.js";
import type { RecursoBaseInput } from "./RecursoBase.js";
export interface DecoratedResourceInput extends RecursoBaseInput {
    etiquetas?: ITag[];
    valoracion?: IValoracion;
    comentarios?: IComentario[];
}
export declare function buildDecoratedResource(input: DecoratedResourceInput): IRecurso;
//# sourceMappingURL=resourceDecoratorFactory.d.ts.map