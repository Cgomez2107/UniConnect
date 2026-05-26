import { RecursoDecorator } from "./RecursoDecorator.js";
import type { IValoracion } from "./IRecurso.js";
export declare class RecursoConValoracion extends RecursoDecorator {
    private readonly valoracion;
    constructor(recurso: RecursoDecorator | import("./IRecurso.js").IRecurso, valoracion: IValoracion);
    getValoracion(): IValoracion;
    getContenido(): string;
    getMetadata(): Record<string, unknown>;
}
//# sourceMappingURL=RecursoConValoracion.d.ts.map