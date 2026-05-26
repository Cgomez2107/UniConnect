import type { IRecurso } from "./IRecurso.js";
export interface RecursoBaseInput {
    id: string;
    titulo: string;
    descripcion: string | null;
    url: string;
    tipo: string;
    uploaderUserId: string;
    subjectId: string;
    subjectName?: string;
    uploaderName?: string;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: string | null;
}
export declare class RecursoBase implements IRecurso {
    readonly id: string;
    readonly titulo: string;
    readonly descripcion: string | null;
    readonly url: string;
    readonly tipo: string;
    readonly uploaderUserId: string;
    readonly subjectId: string;
    readonly subjectName?: string;
    readonly uploaderName?: string;
    readonly ogTitle?: string | null;
    readonly ogDescription?: string | null;
    readonly ogImage?: string | null;
    constructor(input: RecursoBaseInput);
    getContenido(): string;
    getMetadata(): Record<string, unknown>;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=RecursoBase.d.ts.map