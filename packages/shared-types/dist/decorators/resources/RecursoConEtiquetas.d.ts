import { RecursoDecorator } from "./RecursoDecorator.js";
import type { ITag } from "./IRecurso.js";
export declare class RecursoConEtiquetas extends RecursoDecorator {
    private readonly etiquetas;
    constructor(recurso: RecursoDecorator | import("./IRecurso.js").IRecurso, etiquetas: ITag[]);
    getEtiquetas(): ITag[];
    getContenido(): string;
    getMetadata(): Record<string, unknown>;
}
//# sourceMappingURL=RecursoConEtiquetas.d.ts.map