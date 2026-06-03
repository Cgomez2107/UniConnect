import { RecursoDecorator } from "./RecursoDecorator.js";
export class RecursoConEtiquetas extends RecursoDecorator {
    etiquetas;
    constructor(recurso, etiquetas) {
        super(recurso);
        this.etiquetas = etiquetas;
    }
    getEtiquetas() {
        return this.etiquetas;
    }
    getContenido() {
        const base = this.recurso.getContenido();
        if (this.etiquetas.length === 0)
            return base;
        const etiquetasStr = this.etiquetas.map((e) => `#${e.nombre}`).join(" ");
        return `${base} [${etiquetasStr}]`;
    }
    getMetadata() {
        return {
            ...super.getMetadata(),
            tieneEtiquetas: this.etiquetas.length > 0,
            etiquetas: this.etiquetas,
        };
    }
}
//# sourceMappingURL=RecursoConEtiquetas.js.map