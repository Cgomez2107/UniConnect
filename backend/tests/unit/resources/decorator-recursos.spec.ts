import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RecursoBase } from "../../../../packages/shared-types/dist/decorators/resources/RecursoBase.js";
import { RecursoConEtiquetas } from "../../../../packages/shared-types/dist/decorators/resources/RecursoConEtiquetas.js";
import { RecursoConValoracion } from "../../../../packages/shared-types/dist/decorators/resources/RecursoConValoracion.js";
import { RecursoConComentarios } from "../../../../packages/shared-types/dist/decorators/resources/RecursoConComentarios.js";
import { buildDecoratedResource } from "../../../../packages/shared-types/dist/decorators/resources/resourceDecoratorFactory.js";

describe("Decorator Pattern - Recursos de Estudio (US-V03)", () => {
  describe("RecursoBase", () => {
    it("debe asignar los campos base correctamente", () => {
      const recurso = new RecursoBase({
        id: "rec-001",
        titulo: "Cálculo III - Resumen",
        descripcion: "Resumen del capítulo 3",
        url: "https://ejemplo.com/doc.pdf",
        tipo: "pdf",
        uploaderUserId: "user-001",
        subjectId: "mat-001",
        subjectName: "Cálculo III",
        uploaderName: "Carlos Pérez",
      });

      assert.equal(recurso.id, "rec-001");
      assert.equal(recurso.titulo, "Cálculo III - Resumen");
      assert.equal(recurso.descripcion, "Resumen del capítulo 3");
      assert.equal(recurso.url, "https://ejemplo.com/doc.pdf");
      assert.equal(recurso.tipo, "pdf");
      assert.equal(recurso.uploaderUserId, "user-001");
      assert.equal(recurso.subjectId, "mat-001");
      assert.equal(recurso.subjectName, "Cálculo III");
    });

    it("getContenido() debe retornar el título", () => {
      const recurso = new RecursoBase({
        id: "rec-002",
        titulo: "Apuntes de Física",
        descripcion: null,
        url: "https://ejemplo.com/apuntes.pdf",
        tipo: "pdf",
        uploaderUserId: "user-002",
        subjectId: "mat-002",
      });

      assert.equal(recurso.getContenido(), "Apuntes de Física");
    });

    it("getMetadata() debe incluir solo campos base sin decoradores", () => {
      const recurso = new RecursoBase({
        id: "rec-003",
        titulo: "Video Tutorial",
        descripcion: null,
        url: "https://ejemplo.com/video.mp4",
        tipo: "video",
        uploaderUserId: "user-003",
        subjectId: "mat-003",
      });

      const metadata = recurso.getMetadata();

      assert.equal(metadata.id, "rec-003");
      assert.equal(metadata.titulo, "Video Tutorial");
      assert.equal("tieneEtiquetas" in metadata, false);
      assert.equal("tieneValoracion" in metadata, false);
      assert.equal("tieneComentarios" in metadata, false);
    });

    it("toJSON() debe serializar todos los campos base", () => {
      const recurso = new RecursoBase({
        id: "rec-004",
        titulo: "Guía de Estudio",
        descripcion: "Guía completa",
        url: "https://ejemplo.com/guia.pdf",
        tipo: "pdf",
        uploaderUserId: "user-004",
        subjectId: "mat-004",
        ogTitle: "Guía de Estudio UniConnect",
        ogDescription: "Descripción OG",
        ogImage: "https://ejemplo.com/thumb.jpg",
      });

      const json = recurso.toJSON();

      assert.equal(json.id, "rec-004");
      assert.equal(json.titulo, "Guía de Estudio");
      assert.equal(json.ogTitle, "Guía de Estudio UniConnect");
      assert.equal(json.ogImage, "https://ejemplo.com/thumb.jpg");
    });
  });

  describe("RecursoConEtiquetas", () => {
    it("getMetadata() debe incluir etiquetas y marcador tieneEtiquetas=true", () => {
      const base = new RecursoBase({
        id: "rec-010",
        titulo: "Apuntes Álgebra",
        descripcion: null,
        url: "https://ejemplo.com/algebra.pdf",
        tipo: "pdf",
        uploaderUserId: "user-010",
        subjectId: "mat-010",
      });

      const etiquetas = [
        { id: "tag-1", nombre: "Álgebra" },
        { id: "tag-2", nombre: "Ecuaciones" },
        { id: "tag-3", nombre: "Matrices" },
      ];

      const decorated = new RecursoConEtiquetas(base, etiquetas);
      const metadata = decorated.getMetadata();

      assert.equal(metadata.tieneEtiquetas, true);
      assert.equal((metadata.etiquetas as any[]).length, 3);
      assert.equal((metadata.etiquetas as any[])[0].nombre, "Álgebra");
    });

    it("getContenido() debe incluir etiquetas como hashtags", () => {
      const base = new RecursoBase({
        id: "rec-011",
        titulo: "Resumen Química",
        descripcion: null,
        url: "https://ejemplo.com/quimica.pdf",
        tipo: "pdf",
        uploaderUserId: "user-011",
        subjectId: "mat-011",
      });

      const decorated = new RecursoConEtiquetas(base, [
        { id: "t1", nombre: "Química" },
        { id: "t2", nombre: "Orgánica" },
      ]);

      assert.equal(decorated.getContenido(), "Resumen Química [#Química #Orgánica]");
    });

    it("getContenido() sin etiquetas debe retornar solo el título", () => {
      const base = new RecursoBase({
        id: "rec-012",
        titulo: "Documento Simple",
        descripcion: null,
        url: "https://ejemplo.com/doc.pdf",
        tipo: "pdf",
        uploaderUserId: "user-012",
        subjectId: "mat-012",
      });

      const decorated = new RecursoConEtiquetas(base, []);
      assert.equal(decorated.getContenido(), "Documento Simple");
    });

    it("getEtiquetas() debe retornar el array original", () => {
      const base = new RecursoBase({
        id: "rec-013",
        titulo: "Test",
        descripcion: null,
        url: "https://ejemplo.com/test.pdf",
        tipo: "pdf",
        uploaderUserId: "user-013",
        subjectId: "mat-013",
      });

      const tags = [{ id: "t1", nombre: "Test" }];
      const decorated = new RecursoConEtiquetas(base, tags);
      assert.equal(decorated.getEtiquetas(), tags);
    });
  });

  describe("RecursoConValoracion", () => {
    it("getMetadata() debe incluir valoracion y marcador tieneValoracion=true", () => {
      const base = new RecursoBase({
        id: "rec-020",
        titulo: "Excelente Recurso",
        descripcion: null,
        url: "https://ejemplo.com/excelente.pdf",
        tipo: "pdf",
        uploaderUserId: "user-020",
        subjectId: "mat-020",
      });

      const valoracion = { promedio: 4.5, totalVotos: 12 };
      const decorated = new RecursoConValoracion(base, valoracion);
      const metadata = decorated.getMetadata();

      assert.equal(metadata.tieneValoracion, true);
      assert.equal((metadata.valoracion as any).promedio, 4.5);
      assert.equal((metadata.valoracion as any).totalVotos, 12);
    });

    it("getContenido() debe mostrar la valoracion formateada", () => {
      const base = new RecursoBase({
        id: "rec-021",
        titulo: "Guía Práctica",
        descripcion: null,
        url: "https://ejemplo.com/guia.pdf",
        tipo: "pdf",
        uploaderUserId: "user-021",
        subjectId: "mat-021",
      });

      const decorated = new RecursoConValoracion(base, { promedio: 4.0, totalVotos: 8 });
      assert.equal(decorated.getContenido(), "Guía Práctica [★ 4.0 - 8 votos]");
    });

    it("getContenido() sin votos debe mostrar 'Sin valoraciones'", () => {
      const base = new RecursoBase({
        id: "rec-022",
        titulo: "Nuevo Recurso",
        descripcion: null,
        url: "https://ejemplo.com/nuevo.pdf",
        tipo: "pdf",
        uploaderUserId: "user-022",
        subjectId: "mat-022",
      });

      const decorated = new RecursoConValoracion(base, { promedio: 0, totalVotos: 0 });
      assert.equal(decorated.getContenido(), "Nuevo Recurso [Sin valoraciones]");
    });

    it("getValoracion() debe retornar el objeto original", () => {
      const base = new RecursoBase({
        id: "rec-023",
        titulo: "Test",
        descripcion: null,
        url: "https://ejemplo.com/test.pdf",
        tipo: "pdf",
        uploaderUserId: "user-023",
        subjectId: "mat-023",
      });

      const v = { promedio: 3.5, totalVotos: 5 };
      const decorated = new RecursoConValoracion(base, v);
      assert.equal(decorated.getValoracion(), v);
    });
  });

  describe("RecursoConComentarios", () => {
    it("getMetadata() debe incluir comentarios, count y tieneComentarios=true", () => {
      const base = new RecursoBase({
        id: "rec-030",
        titulo: "Recurso Discutido",
        descripcion: null,
        url: "https://ejemplo.com/discutido.pdf",
        tipo: "pdf",
        uploaderUserId: "user-030",
        subjectId: "mat-030",
      });

      const comentarios = [
        { id: "c1", usuarioId: "u1", usuarioNombre: "Ana", contenido: "Muy útil", createdAt: "2026-05-01" },
        { id: "c2", usuarioId: "u2", usuarioNombre: "Luis", contenido: "Gracias!", createdAt: "2026-05-02" },
      ];

      const decorated = new RecursoConComentarios(base, comentarios);
      const metadata = decorated.getMetadata();

      assert.equal(metadata.tieneComentarios, true);
      assert.equal(metadata.comentariosCount, 2);
      assert.equal((metadata.comentarios as any[]).length, 2);
    });

    it("getContenido() debe mostrar cantidad de comentarios", () => {
      const base = new RecursoBase({
        id: "rec-031",
        titulo: "Tutorial",
        descripcion: null,
        url: "https://ejemplo.com/tutorial.pdf",
        tipo: "pdf",
        uploaderUserId: "user-031",
        subjectId: "mat-031",
      });

      const decorated = new RecursoConComentarios(base, [
        { id: "c1", usuarioId: "u1", usuarioNombre: "Ana", contenido: "Bueno", createdAt: "2026-05-01" },
      ]);

      assert.equal(decorated.getContenido(), "Tutorial [1 comentario]");
    });

    it("getContenido() debe pluralizar correctamente", () => {
      const base = new RecursoBase({
        id: "rec-032",
        titulo: "Debate",
        descripcion: null,
        url: "https://ejemplo.com/debate.pdf",
        tipo: "pdf",
        uploaderUserId: "user-032",
        subjectId: "mat-032",
      });

      const decorated = new RecursoConComentarios(base, [
        { id: "c1", usuarioId: "u1", usuarioNombre: "A", contenido: "1", createdAt: "2026-05-01" },
        { id: "c2", usuarioId: "u2", usuarioNombre: "B", contenido: "2", createdAt: "2026-05-02" },
        { id: "c3", usuarioId: "u3", usuarioNombre: "C", contenido: "3", createdAt: "2026-05-03" },
      ]);

      assert.equal(decorated.getContenido(), "Debate [3 comentarios]");
    });

    it("getContenido() sin comentarios debe mostrar 'Sin comentarios'", () => {
      const base = new RecursoBase({
        id: "rec-033",
        titulo: "Silencio",
        descripcion: null,
        url: "https://ejemplo.com/silencio.pdf",
        tipo: "pdf",
        uploaderUserId: "user-033",
        subjectId: "mat-033",
      });

      const decorated = new RecursoConComentarios(base, []);
      assert.equal(decorated.getContenido(), "Silencio [Sin comentarios]");
    });
  });

  describe("Composición: Múltiples decoradores", () => {
    it("RecursoConEtiquetas(RecursoConValoracion(RecursoBase)) debe combinar ambos decoradores", () => {
      const base = new RecursoBase({
        id: "rec-040",
        titulo: "Composición Total",
        descripcion: "Recurso con todo",
        url: "https://ejemplo.com/total.pdf",
        tipo: "pdf",
        uploaderUserId: "user-040",
        subjectId: "mat-040",
      });

      const decorated = new RecursoConEtiquetas(
        new RecursoConValoracion(base, { promedio: 4.2, totalVotos: 15 }),
        [{ id: "t1", nombre: "Composición" }],
      );

      const metadata = decorated.getMetadata();

      assert.equal(metadata.id, "rec-040");
      assert.equal(metadata.tieneValoracion, true);
      assert.equal((metadata.valoracion as any).promedio, 4.2);
      assert.equal(metadata.tieneEtiquetas, true);
      assert.equal((metadata.etiquetas as any[]).length, 1);

      const contenido = decorated.getContenido();
      assert(contenido.includes("Composición Total"));
      assert(contenido.includes("4.2"));
      assert(contenido.includes("#Composición"));
    });

    it("RecursoConComentarios(RecursoConValoracion(RecursoConEtiquetas(RecursoBase))) — 3 decoradores anidados", () => {
      const base = new RecursoBase({
        id: "rec-041",
        titulo: "Triple Decorado",
        descripcion: null,
        url: "https://ejemplo.com/triple.pdf",
        tipo: "link",
        uploaderUserId: "user-041",
        subjectId: "mat-041",
      });

      const decoradoFinal = new RecursoConComentarios(
        new RecursoConValoracion(
          new RecursoConEtiquetas(base, [
            { id: "t1", nombre: "Premium" },
          ]),
          { promedio: 5.0, totalVotos: 42 },
        ),
        [
          { id: "c1", usuarioId: "u1", usuarioNombre: "Reviewer", contenido: "Excelente", createdAt: "2026-05-01" },
        ],
      );

      const metadata = decoradoFinal.getMetadata();

      assert.equal(metadata.id, "rec-041");
      assert.equal(metadata.tieneEtiquetas, true);
      assert.equal(metadata.tieneValoracion, true);
      assert.equal(metadata.tieneComentarios, true);
      assert.equal(metadata.comentariosCount, 1);

      const contenido = decoradoFinal.getContenido();
      assert(contenido.includes("Triple Decorado"));
      assert(contenido.includes("5.0"));
      assert(contenido.includes("#Premium"));
      assert(contenido.includes("1 comentario"));
    });

    it("buildDecoratedResource factory construye cadena correcta a partir de input plano", () => {
      const decorated = buildDecoratedResource({
        id: "rec-050",
        titulo: "Factory Test",
        descripcion: "Creado desde factory",
        url: "https://ejemplo.com/factory.pdf",
        tipo: "video",
        uploaderUserId: "user-050",
        subjectId: "mat-050",
        etiquetas: [
          { id: "t1", nombre: "Factory" },
          { id: "t2", nombre: "Test" },
        ],
        valoracion: { promedio: 3.0, totalVotos: 10 },
        comentarios: [],
      });

      const metadata = decorated.getMetadata();

      assert.equal(metadata.id, "rec-050");
      assert.equal(metadata.tieneEtiquetas, true);
      assert.equal(metadata.tieneValoracion, true);
      // Sin comentarios, no debe marcar tieneComentarios
      assert.equal(metadata.tieneComentarios, undefined);
    });
  });
});
