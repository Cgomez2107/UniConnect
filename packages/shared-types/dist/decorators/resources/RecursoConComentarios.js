import { RecursoDecorator } from "./RecursoDecorator.js";
export class RecursoConComentarios extends RecursoDecorator {
    comentarios;
    constructor(recurso, comentarios) {
        super(recurso);
        this.comentarios = comentarios;
    }
    getComentarios() {
        return this.comentarios;
    }
    getContenido() {
        const base = this.recurso.getContenido();
        const count = this.comentarios.length;
        if (count === 0)
            return `${base} [Sin comentarios]`;
        return `${base} [${count} comentario${count !== 1 ? "s" : ""}]`;
    }
    getMetadata() {
        return {
            ...super.getMetadata(),
            tieneComentarios: this.comentarios.length > 0,
            comentarios: this.comentarios,
            comentariosCount: this.comentarios.length,
        };
    }
}
//# sourceMappingURL=RecursoConComentarios.js.map