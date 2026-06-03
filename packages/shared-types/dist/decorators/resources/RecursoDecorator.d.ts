import type { IRecurso } from "./IRecurso.js";
export declare abstract class RecursoDecorator implements IRecurso {
    protected readonly recurso: IRecurso;
    constructor(recurso: IRecurso);
    get id(): string;
    get titulo(): string;
    get descripcion(): string | null;
    get url(): string;
    get tipo(): string;
    get uploaderUserId(): string;
    get subjectId(): string;
    get subjectName(): string | undefined;
    get uploaderName(): string | undefined;
    get ogTitle(): string | null | undefined;
    get ogDescription(): string | null | undefined;
    get ogImage(): string | null | undefined;
    getContenido(): string;
    getMetadata(): Record<string, unknown>;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=RecursoDecorator.d.ts.map