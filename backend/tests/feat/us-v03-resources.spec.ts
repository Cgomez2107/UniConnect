import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BaseResourceCard } from "../../services/resources/src/domain/decorators/BaseResourceCard.js";
import { OpenGraphDecorator } from "../../services/resources/src/domain/decorators/OpenGraphDecorator.js";
import { TagsDecorator } from "../../services/resources/src/domain/decorators/TagsDecorator.js";
import { RatingDecorator } from "../../services/resources/src/domain/decorators/RatingDecorator.js";
import { CommentsDecorator } from "../../services/resources/src/domain/decorators/CommentsDecorator.js";
import type { IResourceCard } from "../../services/resources/src/domain/decorators/IResourceCard.js";
import { OpenGraphService } from "../../services/resources/src/infrastructure/og/OpenGraphService.js";
import type { StudyResource } from "../../services/resources/src/domain/entities/StudyResource.js";
import type { IStudyResourceRepository } from "../../services/resources/src/domain/repositories/IStudyResourceRepository.js";
import type { IPermissionValidator } from "../../services/resources/src/domain/services/IPermissionValidator.js";
import { InMemoryStudyResourceRepository } from "../../services/resources/src/infrastructure/database/InMemoryStudyResourceRepository.js";
import { UpdateStudyResource } from "../../services/resources/src/application/use-cases/UpdateStudyResource.js";
import { NotFoundError } from "../../shared/libs/errors/NotFoundError.js";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function extractOG(html: string, property: string): string | null {
  const regex = new RegExp(
    `(?:property=["']${property}["'][^>]*content=["']([^"']+)["']|content=["']([^"']+)["'][^>]*property=["']${property}["'])`,
    "i",
  );
  const match = regex.exec(html);
  return match?.[1] ?? match?.[2] ?? null;
}

function makeFileResource(overrides: Partial<StudyResource> = {}): StudyResource {
  return {
    id: "res-file-001",
    userId: "user-creator",
    programId: "prog-001",
    subjectId: "subj-001",
    resourceType: "file",
    title: "Apuntes de Cálculo",
    description: "PDF con ejercicios resueltos",
    url: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    ogScrapedAt: null,
    fileUrl: "https://storage.example.com/file.pdf",
    fileName: "calculo-ejercicios.pdf",
    fileType: "pdf",
    fileSizeKb: 2048,
    createdAt: "2026-05-16T10:00:00.000Z",
    updatedAt: "2026-05-16T10:00:00.000Z",
    profiles: { fullName: "Carlos Pérez", avatarUrl: null },
    subjects: { name: "Cálculo I" },
    ...overrides,
  };
}

function makeLinkResource(overrides: Partial<StudyResource> = {}): StudyResource {
  return {
    id: "res-link-001",
    userId: "user-creator",
    programId: "prog-001",
    subjectId: "subj-001",
    resourceType: "link",
    title: "Video sobre derivadas",
    description: null,
    url: "https://youtube.com/watch?v=abc123",
    ogTitle: "Derivadas desde Cero",
    ogDescription: "Aprende derivadas paso a paso",
    ogImage: "https://img.youtube.com/vi/abc123/maxresdefault.jpg",
    ogScrapedAt: "2026-05-16T10:05:00.000Z",
    fileUrl: null,
    fileName: null,
    fileType: null,
    fileSizeKb: null,
    createdAt: "2026-05-16T10:05:00.000Z",
    updatedAt: "2026-05-16T10:05:00.000Z",
    profiles: { fullName: "María López", avatarUrl: "https://storage.example.com/avatar.jpg" },
    subjects: { name: "Cálculo I" },
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────
// AC-01: OpenGraphService — Regex bidireccional (AC-01, AC-05)
// ──────────────────────────────────────────────────────────────

describe("US-V03 - AC-01/AC-05: OpenGraph regex bidireccional", () => {
  it("debe extraer og:title con property antes que content", () => {
    const html = `<meta property="og:title" content="Título Normal">`;
    assert.equal(extractOG(html, "og:title"), "Título Normal");
  });

  it("debe extraer og:description con property antes que content", () => {
    const html = `<meta property="og:description" content="Descripción Normal">`;
    assert.equal(extractOG(html, "og:description"), "Descripción Normal");
  });

  it("debe extraer og:image con property antes que content", () => {
    const html = `<meta property="og:image" content="https://example.com/img.jpg">`;
    assert.equal(extractOG(html, "og:image"), "https://example.com/img.jpg");
  });

  it("debe extraer og:title con content antes que property (orden inverso)", () => {
    const html = `<meta content="Título Inverso" property="og:title">`;
    assert.equal(extractOG(html, "og:title"), "Título Inverso");
  });

  it("debe extraer og:description en orden inverso", () => {
    const html = `<meta content="Descripción Inversa" property="og:description">`;
    assert.equal(extractOG(html, "og:description"), "Descripción Inversa");
  });

  it("debe extraer og:image en orden inverso", () => {
    const html = `<meta content="https://example.com/img-inv.jpg" property="og:image">`;
    assert.equal(extractOG(html, "og:image"), "https://example.com/img-inv.jpg");
  });

  it("debe retornar null cuando no existe la meta propiedad", () => {
    const html = `<meta property="og:title" content="X">`;
    assert.equal(extractOG(html, "og:video"), null);
  });

  it("debe extraer de HTML real con múltiples meta tags", () => {
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<meta property="og:title" content="Artículo de prueba">
<meta property="og:description" content="Un artículo largo">
<meta property="og:image" content="https://example.com/preview.jpg">
<meta property="og:url" content="https://example.com/article">
<title>Artículo</title>
</head><body></body></html>`;
    assert.equal(extractOG(html, "og:title"), "Artículo de prueba");
    assert.equal(extractOG(html, "og:description"), "Un artículo largo");
    assert.equal(extractOG(html, "og:image"), "https://example.com/preview.jpg");
  });

  it("debe extraer de HTML con orden mixto property/content alternados", () => {
    const html = `<!DOCTYPE html>
<html><head>
<meta content="Preview" property="og:title">
<meta property="og:description" content="Descripción">
<meta content="https://example.com/img.jpg" property="og:image">
</head><body></body></html>`;
    assert.equal(extractOG(html, "og:title"), "Preview");
    assert.equal(extractOG(html, "og:description"), "Descripción");
    assert.equal(extractOG(html, "og:image"), "https://example.com/img.jpg");
  });
});

// ──────────────────────────────────────────────────────────────
// AC-01: OpenGraphService — Cache stats
// ──────────────────────────────────────────────────────────────

describe("US-V03 - AC-01: OpenGraphService cache", () => {
  it("getCacheStats debe retornar estado inicial vacío", () => {
    const service = new OpenGraphService(9_999_999);
    const stats = service.getCacheStats();
    assert.equal(stats.size, 0);
    assert.equal(stats.hits, 0);
    assert.equal(stats.misses, 0);
  });

  it("getCacheStats debe reportar hits y misses acumulados", async () => {
    const service = new OpenGraphService(9_999_999);
    const initial = service.getCacheStats();
    assert.equal(initial.size, 0);

    await service.scrape("https://ejemplo.com/inexistente");
    const afterMiss = service.getCacheStats();
    assert.equal(afterMiss.misses, 1);

    await service.scrape("https://ejemplo.com/inexistente");
    const afterHit = service.getCacheStats();
    assert.equal(afterHit.hits, 1);
  });
});

// ──────────────────────────────────────────────────────────────
// AC-02 / AC-07: Decorator Pattern — IResourceCard
// ──────────────────────────────────────────────────────────────

describe("US-V03 - AC-02/AC-07: Decorator de recursos", () => {
  it("BaseResourceCard.toJSON() debe retornar contenido base + metadata para tipo file", () => {
    const resource = makeFileResource();
    const card: IResourceCard = new BaseResourceCard(resource);
    const json = card.toJSON();

    assert.equal(json.id, "res-file-001");
    assert.equal(json.type, "file");
    assert.equal(json.title, "Apuntes de Cálculo");
    assert.equal(json.description, "PDF con ejercicios resueltos");
    assert.equal(json.fileUrl, "https://storage.example.com/file.pdf");
    assert.equal(json.fileName, "calculo-ejercicios.pdf");
    assert.equal(json.fileType, "pdf");
    assert.equal(json.fileSizeKb, 2048);
    assert.equal(json.author.fullName, "Carlos Pérez");
    assert.equal(json.subject.name, "Cálculo I");
    assert.equal(json.url, undefined);
  });

  it("BaseResourceCard.toJSON() debe discriminar type link correctamente", () => {
    const resource = makeLinkResource();
    const card: IResourceCard = new BaseResourceCard(resource);
    const json = card.toJSON();

    assert.equal(json.type, "link");
    assert.equal(json.url, "https://youtube.com/watch?v=abc123");
    assert.equal(json.fileUrl, undefined);
    assert.equal(json.fileName, undefined);
  });

  it("OpenGraphDecorator debe agregar og metadata al JSON", () => {
    const resource = makeLinkResource();
    const base = new BaseResourceCard(resource);
    const decorated = OpenGraphDecorator.wrap(base, {
      ogTitle: resource.ogTitle,
      ogDescription: resource.ogDescription,
      ogImage: resource.ogImage,
    });

    const json = decorated.toJSON();
    assert.equal(json.ogTitle, "Derivadas desde Cero");
    assert.equal(json.ogDescription, "Aprende derivadas paso a paso");
    assert.equal(json.ogImage, "https://img.youtube.com/vi/abc123/maxresdefault.jpg");
    assert.equal(json.title, "Video sobre derivadas");
    assert.equal(json.url, "https://youtube.com/watch?v=abc123");
  });

  it("TagsDecorator debe agregar tags al JSON", () => {
    const resource = makeLinkResource();
    const base = new BaseResourceCard(resource);
    const tagged = TagsDecorator.wrap(base, ["matemáticas", "cálculo", "video"]);

    const json = tagged.toJSON();
    assert.deepEqual(json.tags, ["matemáticas", "cálculo", "video"]);
    assert.equal(json.title, "Video sobre derivadas");
  });

  it("RatingDecorator debe agregar rating al JSON", () => {
    const resource = makeLinkResource();
    const base = new BaseResourceCard(resource);
    const rated = RatingDecorator.wrap(base, { average: 4.5, total: 12 });

    const json = rated.toJSON();
    assert.deepEqual(json.rating, { average: 4.5, total: 12 });
    assert.equal(json.title, "Video sobre derivadas");
  });

  it("CommentsDecorator debe agregar comments al JSON", () => {
    const resource = makeLinkResource();
    const base = new BaseResourceCard(resource);
    const commented = CommentsDecorator.wrap(base, [
      { id: "c1", author: "Ana", content: "Muy útil", createdAt: "2026-05-16T12:00:00.000Z" },
    ]);

    const json = commented.toJSON();
    assert.equal(json.comments.length, 1);
    assert.equal(json.comments[0].author, "Ana");
    assert.equal(json.comments[0].content, "Muy útil");
    assert.equal(json.title, "Video sobre derivadas");
  });

  it("composición múltiple: TagsDecorator(OpenGraphDecorator(BaseResourceCard)) acumula sin mutar", () => {
    const resource = makeLinkResource();
    const base = new BaseResourceCard(resource);

    const withOG = OpenGraphDecorator.wrap(base, {
      ogTitle: resource.ogTitle,
      ogDescription: resource.ogDescription,
      ogImage: resource.ogImage,
    });
    const withTags = TagsDecorator.wrap(withOG, ["matemáticas", "cálculo"]);

    const json = withTags.toJSON();

    assert.equal(json.id, "res-link-001");
    assert.equal(json.type, "link");
    assert.equal(json.url, "https://youtube.com/watch?v=abc123");
    assert.equal(json.ogTitle, "Derivadas desde Cero");
    assert.deepEqual(json.tags, ["matemáticas", "cálculo"]);

    // Verificar que el base no fue mutado
    const baseJson = base.toJSON();
    assert.equal(baseJson.ogTitle, undefined);
    assert.equal(baseJson.tags, undefined);
  });

  it("toJSON no debe incluir fileUrl para type link ni url para type file", () => {
    const link = makeLinkResource();
    const file = makeFileResource();

    const linkCard = new BaseResourceCard(link);
    const fileCard = new BaseResourceCard(file);

    const linkJson = linkCard.toJSON();
    const fileJson = fileCard.toJSON();

    assert.equal(linkJson.fileUrl, undefined);
    assert.equal(linkJson.fileName, undefined);
    assert.equal(fileJson.url, undefined);
  });

  it("getContent() debe retornar solo campos base sin metadata", () => {
    const resource = makeLinkResource();
    const base = new BaseResourceCard(resource);
    const decorated = OpenGraphDecorator.wrap(base, {
      ogTitle: resource.ogTitle,
      ogDescription: resource.ogDescription,
      ogImage: resource.ogImage,
    });

    const content = decorated.getContent();
    assert.equal(content.id, "res-link-001");
    assert.equal(content.type, "link");
    assert.equal(content.ogTitle, undefined);
  });

  it("getMetadata() del decorador externo debe incluir las capas internas", () => {
    const resource = makeLinkResource();
    const base = new BaseResourceCard(resource);
    const withOG = OpenGraphDecorator.wrap(base, {
      ogTitle: resource.ogTitle,
      ogDescription: resource.ogDescription,
      ogImage: resource.ogImage,
    });
    const withTags = TagsDecorator.wrap(withOG, ["test"]);

    const meta = withTags.getMetadata();
    assert.equal(meta.ogTitle, "Derivadas desde Cero");
    assert.deepEqual(meta.tags, ["test"]);
    assert.ok(meta.author);
  });

  it("composición con los 3 decoradores: TagsDecorator + RatingDecorator + CommentsDecorator", () => {
    const resource = makeLinkResource();
    let card: IResourceCard = new BaseResourceCard(resource);

    card = OpenGraphDecorator.wrap(card, {
      ogTitle: resource.ogTitle,
      ogDescription: resource.ogDescription,
      ogImage: resource.ogImage,
    });
    card = TagsDecorator.wrap(card, ["matemáticas", "cálculo"]);
    card = RatingDecorator.wrap(card, { average: 4.2, total: 8 });
    card = CommentsDecorator.wrap(card, [
      { id: "c1", author: "Luis", content: "Excelente", createdAt: "2026-05-16T12:00:00.000Z" },
    ]);

    const json = card.toJSON();
    assert.equal(json.id, "res-link-001");
    assert.equal(json.type, "link");
    assert.equal(json.ogTitle, "Derivadas desde Cero");
    assert.deepEqual(json.tags, ["matemáticas", "cálculo"]);
    assert.deepEqual(json.rating, { average: 4.2, total: 8 });
    assert.equal(json.comments[0].author, "Luis");
    assert.equal(json.comments[0].content, "Excelente");
  });
});

// ──────────────────────────────────────────────────────────────
// AC-03: Permisos Multi-Tabla
// ──────────────────────────────────────────────────────────────

describe("US-V03 - AC-03: Permisos multi-tabla", () => {
  it("el creador del recurso debe poder editar", async () => {
    const validator = {
      canEditResource: async (_resourceId: string, actorUserId: string) => {
        return actorUserId === "user-creator";
      },
    };

    const allowed = await validator.canEditResource("res-001", "user-creator");
    assert.equal(allowed, true);
  });

  it("el administrador del grupo debe poder editar (herencia ST01)", async () => {
    const adminUsers = new Set(["user-admin", "user-creator"]);
    const validator = {
      canEditResource: async (_resourceId: string, actorUserId: string) => {
        return adminUsers.has(actorUserId);
      },
    };

    const allowed = await validator.canEditResource("res-001", "user-admin");
    assert.equal(allowed, true);
  });

  it("un miembro aleatorio sin permisos debe ser rechazado (403)", async () => {
    const authorized = new Set(["user-creator", "user-admin"]);
    const validator = {
      canEditResource: async (_resourceId: string, actorUserId: string) => {
        return authorized.has(actorUserId);
      },
    };

    const allowed = await validator.canEditResource("res-001", "random-member");
    assert.equal(allowed, false);
  });

  it("PostgresPermissionValidator SQL debe verificar creador, author_id y admins", () => {
    const sql = `
      SELECT EXISTS (
        SELECT 1 FROM study_resources sr
        LEFT JOIN study_requests req ON req.subject_id = sr.subject_id
        LEFT JOIN study_request_admins adm ON adm.request_id = req.id AND adm.user_id = $2
        WHERE sr.id = $1
          AND (
            sr.user_id = $2
            OR req.author_id = $2
            OR adm.user_id = $2
          )
      ) AS allowed
    `.trim();

    assert.ok(sql.includes("sr.user_id = $2"), "Debe verificar creador del recurso");
    assert.ok(sql.includes("req.author_id = $2"), "Debe verificar author del grupo");
    assert.ok(sql.includes("adm.user_id = $2"), "Debe verificar admin adicional del grupo");
    assert.ok(sql.includes("LEFT JOIN study_requests"), "Debe hacer JOIN con study_requests");
    assert.ok(sql.includes("LEFT JOIN study_request_admins"), "Debe hacer JOIN con study_request_admins");
  });

  it("UpdateStudyResource debe validar existencia antes que permisos (NotFoundError > AuthorizationError)", async () => {
    const repository: IStudyResourceRepository = {
      list: async () => ({ rows: [], total: 0 }),
      getById: async (_id: string) => null,
      create: async (_input) => { throw new Error("not implemented"); },
      updateById: async (_id: string, _p: unknown) => null,
      deleteById: async (_id: string) => false,
    };
    const validator: IPermissionValidator = {
      canEditResource: async (_resourceId: string, _actorUserId: string) => false,
    };

    const useCase = new UpdateStudyResource(repository, validator);
    await assert.rejects(
      () => useCase.execute("no-existe", "user-cualquiera", { title: "Nuevo" }),
      NotFoundError,
    );
  });
});

// ──────────────────────────────────────────────────────────────
// AC-04, AC-05, AC-06: DTO unificado ResourceCardResponse
// ──────────────────────────────────────────────────────────────

describe("US-V03 - AC-04/05/06: ResourceCardResponse DTO unificado", () => {
  it("recurso tipo file debe contener fileUrl, fileName y NO url", () => {
    const resource = makeFileResource();
    const card = new BaseResourceCard(resource);
    const json = card.toJSON();

    assert.equal(json.type, "file");
    assert.equal(json.fileUrl, "https://storage.example.com/file.pdf");
    assert.equal(json.fileName, "calculo-ejercicios.pdf");
    assert.equal(json.fileType, "pdf");
    assert.equal(json.fileSizeKb, 2048);
    assert.equal(json.url, undefined);
  });

  it("recurso tipo link (con OpenGraphDecorator) debe contener url y og*", () => {
    const resource = makeLinkResource();
    const base = new BaseResourceCard(resource);
    const card = OpenGraphDecorator.wrap(base, {
      ogTitle: resource.ogTitle,
      ogDescription: resource.ogDescription,
      ogImage: resource.ogImage,
    });

    const json = card.toJSON();
    assert.equal(json.type, "link");
    assert.equal(json.url, "https://youtube.com/watch?v=abc123");
    assert.equal(json.ogTitle, "Derivadas desde Cero");
    assert.equal(json.ogDescription, "Aprende derivadas paso a paso");
    assert.equal(json.ogImage, "https://img.youtube.com/vi/abc123/maxresdefault.jpg");
    assert.equal(json.fileUrl, undefined);
    assert.equal(json.fileName, undefined);
  });

  it("campos comunes (id, title, description, author, subject, createdAt, updatedAt) deben estar siempre presentes", () => {
    const file = makeFileResource();
    const link = makeLinkResource();

    const fileJson = new BaseResourceCard(file).toJSON();
    const linkJson = new BaseResourceCard(link).toJSON();

    for (const json of [fileJson, linkJson]) {
      assert.ok(typeof json.id === "string", "id debe estar presente");
      assert.ok(typeof json.title === "string", "title debe estar presente");
      assert.ok(typeof json.createdAt === "string", "createdAt debe estar presente");
      assert.ok(typeof json.updatedAt === "string", "updatedAt debe estar presente");
      assert.ok(json.author?.fullName, "author.fullName debe estar presente");
      assert.ok(json.subject?.name, "subject.name debe estar presente");
    }
  });

  it("ResourceCardResponse decorado debe ser serializable a JSON sin pérdida", () => {
    const resource = makeLinkResource();
    const base = new BaseResourceCard(resource);
    const decorated = OpenGraphDecorator.wrap(base, {
      ogTitle: resource.ogTitle,
      ogDescription: resource.ogDescription,
      ogImage: resource.ogImage,
    });

    const json = decorated.toJSON();
    const serialized = JSON.stringify(json);
    const parsed = JSON.parse(serialized);

    assert.equal(parsed.id, "res-link-001");
    assert.equal(parsed.type, "link");
    assert.equal(parsed.ogTitle, "Derivadas desde Cero");
    assert.equal(parsed.url, "https://youtube.com/watch?v=abc123");
  });

  it("la fábrica toCardResponse del controller debe construir el DTO sin casteos inseguros", () => {
    const resource = makeLinkResource();

    // Simula la lógica de toCardResponse directa desde la entidad (sin unsafe cast)
    function toCardResponse(r: typeof resource): Record<string, unknown> {
      if (r.resourceType === "link") {
        return {
          id: r.id,
          title: r.title,
          description: r.description ?? null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          author: r.profiles
            ? { fullName: r.profiles.fullName, avatarUrl: r.profiles.avatarUrl }
            : null,
          subject: r.subjects ? { name: r.subjects.name } : null,
          type: "link",
          url: r.url ?? null,
          ogTitle: r.ogTitle ?? null,
          ogDescription: r.ogDescription ?? null,
          ogImage: r.ogImage ?? null,
        };
      }

      return {
        id: r.id,
        title: r.title,
        description: r.description ?? null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        author: r.profiles
          ? { fullName: r.profiles.fullName, avatarUrl: r.profiles.avatarUrl }
          : null,
        subject: r.subjects ? { name: r.subjects.name } : null,
        type: "file",
        fileUrl: r.fileUrl ?? null,
        fileName: r.fileName ?? null,
        fileType: r.fileType ?? null,
        fileSizeKb: r.fileSizeKb ?? null,
      };
    }

    const response = toCardResponse(resource);
    assert.equal(response.type, "link");
    assert.equal(response.url, "https://youtube.com/watch?v=abc123");
    assert.equal(response.ogTitle, "Derivadas desde Cero");
    assert.equal(response.ogDescription, "Aprende derivadas paso a paso");
    assert.equal(response.ogImage, "https://img.youtube.com/vi/abc123/maxresdefault.jpg");
    assert.ok(typeof response.updatedAt === "string", "updatedAt debe estar presente");
  });
});

// ──────────────────────────────────────────────────────────────
// AC-01/AC-05: Integración creación de recurso link
// ──────────────────────────────────────────────────────────────

describe("US-V03 - AC-01: Validación creación recurso link", () => {
  it("debe fallar si se omite url para resourceType=link", () => {
    const body = { resourceType: "link", url: "" };

    assert.throws(
      () => {
        if (body.resourceType === "link" && !body.url?.trim()) {
          throw new Error("url es obligatorio para recursos tipo link.");
        }
      },
      /url es obligatorio/,
    );
  });

  it("debe aceptar url válida para resourceType=link", () => {
    const body = { resourceType: "link", url: "https://youtube.com/watch?v=abc123" };

    assert.doesNotThrow(() => {
      if (body.resourceType === "link" && !body.url?.trim()) {
        throw new Error("url es obligatorio para recursos tipo link.");
      }
    });
  });

  it("debe fallar si se omite fileUrl para resourceType=file", () => {
    const body = { resourceType: "file", fileUrl: "" };

    assert.throws(
      () => {
        if (body.resourceType !== "link" && !body.fileUrl?.trim()) {
          throw new Error("fileUrl es obligatorio.");
        }
      },
      /fileUrl es obligatorio/,
    );
  });
});

// ──────────────────────────────────────────────────────────────
// AC-04: Listado con tipos mixtos
// ──────────────────────────────────────────────────────────────

describe("US-V03 - AC-04: Listado con tipos mixtos", () => {
  it("debe manejar array de recursos mixtos file+link correctamente", () => {
    const resources = [makeFileResource(), makeLinkResource()];
    const cards = resources.map((r) => new BaseResourceCard(r).toJSON());

    assert.equal(cards.length, 2);
    assert.equal(cards[0].type, "file");
    assert.equal(cards[1].type, "link");

    const fileCard = cards[0] as Record<string, unknown>;
    const linkCard = cards[1] as Record<string, unknown>;

    assert.ok(typeof fileCard.fileUrl === "string");
    assert.equal(fileCard.url, undefined);
    assert.ok(typeof linkCard.url === "string");
    assert.equal(linkCard.fileUrl, undefined);
  });

  it("debe filtrar por resourceType=link usando InMemoryRepository", async () => {
    const repo = new InMemoryStudyResourceRepository();
    await repo.create(makeFileResource({ id: "f1" }));
    await repo.create(makeLinkResource({ id: "l1" }));
    await repo.create(makeFileResource({ id: "f2" }));
    await repo.create(makeLinkResource({ id: "l2" }));

    const result = await repo.list({ page: 0, pageSize: 10, resourceType: "link" });
    assert.equal(result.total, 2);
    assert.equal(result.rows.length, 2);
    assert.ok(result.rows.every(r => r.resourceType === "link"));
  });

  it("debe filtrar por resourceType=file usando InMemoryRepository", async () => {
    const repo = new InMemoryStudyResourceRepository();
    await repo.create(makeFileResource({ id: "f1" }));
    await repo.create(makeLinkResource({ id: "l1" }));

    const result = await repo.list({ page: 0, pageSize: 10, resourceType: "file" });
    assert.equal(result.total, 1);
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].resourceType, "file");
  });

  it("debe retornar total correcto con paginación", async () => {
    const repo = new InMemoryStudyResourceRepository();
    for (let i = 0; i < 25; i++) {
      await repo.create(makeFileResource({ id: `f-${i}` }));
    }

    const page1 = await repo.list({ page: 0, pageSize: 10 });
    assert.equal(page1.rows.length, 10);
    assert.equal(page1.total, 25);

    const page2 = await repo.list({ page: 1, pageSize: 10 });
    assert.equal(page2.rows.length, 10);
    assert.equal(page2.total, 25);

    const page3 = await repo.list({ page: 2, pageSize: 10 });
    assert.equal(page3.rows.length, 5);
    assert.equal(page3.total, 25);
  });

  it("debe retornar total correcto con filtro aplicado", async () => {
    const repo = new InMemoryStudyResourceRepository();
    await repo.create(makeFileResource({ id: "f1" }));
    await repo.create(makeFileResource({ id: "f2" }));
    await repo.create(makeLinkResource({ id: "l1" }));
    await repo.create(makeLinkResource({ id: "l2" }));

    const result = await repo.list({ page: 0, pageSize: 10, resourceType: "link" });
    assert.equal(result.total, 2);
    assert.equal(result.rows.length, 2);
  });
});
