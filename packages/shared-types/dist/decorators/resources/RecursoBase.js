export class RecursoBase {
    id;
    titulo;
    descripcion;
    url;
    tipo;
    uploaderUserId;
    subjectId;
    subjectName;
    uploaderName;
    ogTitle;
    ogDescription;
    ogImage;
    constructor(input) {
        this.id = input.id;
        this.titulo = input.titulo;
        this.descripcion = input.descripcion;
        this.url = input.url;
        this.tipo = input.tipo;
        this.uploaderUserId = input.uploaderUserId;
        this.subjectId = input.subjectId;
        this.subjectName = input.subjectName;
        this.uploaderName = input.uploaderName;
        this.ogTitle = input.ogTitle;
        this.ogDescription = input.ogDescription;
        this.ogImage = input.ogImage;
    }
    getContenido() {
        return this.titulo;
    }
    getMetadata() {
        return {
            id: this.id,
            titulo: this.titulo,
            descripcion: this.descripcion,
            url: this.url,
            tipo: this.tipo,
            uploaderUserId: this.uploaderUserId,
            subjectId: this.subjectId,
            subjectName: this.subjectName,
            uploaderName: this.uploaderName,
            ogTitle: this.ogTitle,
            ogDescription: this.ogDescription,
            ogImage: this.ogImage,
        };
    }
    toJSON() {
        return this.getMetadata();
    }
}
//# sourceMappingURL=RecursoBase.js.map