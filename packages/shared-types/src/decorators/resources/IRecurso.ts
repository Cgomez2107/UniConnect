export interface ITag {
  id: string;
  nombre: string;
}

export interface IValoracion {
  promedio: number;
  totalVotos: number;
}

export interface IComentario {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  contenido: string;
  createdAt: string;
}

export interface IRecurso {
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

  getContenido(): string;
  getMetadata(): Record<string, unknown>;
  toJSON(): Record<string, unknown>;
}
