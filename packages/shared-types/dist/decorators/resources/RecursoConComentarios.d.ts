import { RecursoDecorator } from "./RecursoDecorator.js";
import type { IComentario } from "./IRecurso.js";
export declare class RecursoConComentarios extends RecursoDecorator {
    private readonly comentarios;
    constructor(recurso: RecursoDecorator | import("./IRecurso.js").IRecurso, comentarios: IComentario[]);
    getComentarios(): IComentario[];
    getContenido(): string;
    getMetadata(): Record<string, unknown>;
}
//# sourceMappingURL=RecursoConComentarios.d.ts.map