import { RecursoDecorator } from "./RecursoDecorator.js";
export class RecursoConValoracion extends RecursoDecorator {
    valoracion;
    constructor(recurso, valoracion) {
        super(recurso);
        this.valoracion = valoracion;
    }
    getValoracion() {
        return this.valoracion;
    }
    getContenido() {
        const base = this.recurso.getContenido();
        if (this.valoracion.totalVotos === 0)
            return `${base} [Sin valoraciones]`;
        return `${base} [★ ${this.valoracion.promedio.toFixed(1)} - ${this.valoracion.totalVotos} votos]`;
    }
    getMetadata() {
        return {
            ...super.getMetadata(),
            tieneValoracion: this.valoracion.totalVotos > 0,
            valoracion: this.valoracion,
        };
    }
}
//# sourceMappingURL=RecursoConValoracion.js.map