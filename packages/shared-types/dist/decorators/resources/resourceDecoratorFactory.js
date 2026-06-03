import { RecursoBase } from "./RecursoBase.js";
import { RecursoConEtiquetas } from "./RecursoConEtiquetas.js";
import { RecursoConValoracion } from "./RecursoConValoracion.js";
import { RecursoConComentarios } from "./RecursoConComentarios.js";
export function buildDecoratedResource(input) {
    const base = new RecursoBase(input);
    let decorated = base;
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
//# sourceMappingURL=resourceDecoratorFactory.js.map