export class RecursoDecorator {
    recurso;
    constructor(recurso) {
        this.recurso = recurso;
    }
    get id() {
        return this.recurso.id;
    }
    get titulo() {
        return this.recurso.titulo;
    }
    get descripcion() {
        return this.recurso.descripcion;
    }
    get url() {
        return this.recurso.url;
    }
    get tipo() {
        return this.recurso.tipo;
    }
    get uploaderUserId() {
        return this.recurso.uploaderUserId;
    }
    get subjectId() {
        return this.recurso.subjectId;
    }
    get subjectName() {
        return this.recurso.subjectName;
    }
    get uploaderName() {
        return this.recurso.uploaderName;
    }
    get ogTitle() {
        return this.recurso.ogTitle;
    }
    get ogDescription() {
        return this.recurso.ogDescription;
    }
    get ogImage() {
        return this.recurso.ogImage;
    }
    getContenido() {
        return this.recurso.getContenido();
    }
    getMetadata() {
        return { ...this.recurso.getMetadata() };
    }
    toJSON() {
        return this.getMetadata();
    }
}
//# sourceMappingURL=RecursoDecorator.js.map