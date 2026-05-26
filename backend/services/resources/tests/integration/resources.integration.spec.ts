import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createResourcesServer } from "../../src/app/createResourcesServer.js";
import { ResourcesController } from "../../src/interfaces/http/controllers/ResourcesController.js";
import { CreateResourceContract, CreateResourceRequestSchema } from "@uniconnect/shared-types/contracts/resource";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const SUBJECT_ID = "550e8400-e29b-41d4-a716-446655440002";

type UseCaseStub = { execute: ReturnType<typeof vi.fn> };

function buildResourcesServer() {
  const sampleResource = {
    id: UUID,
    userId: USER_ID,
    programId: "550e8400-e29b-41d4-a716-446655440010",
    subjectId: SUBJECT_ID,
    resourceType: "link" as const,
    title: "Algebra Lineal",
    description: "Libro de algebra para ingenieria",
    url: "https://example.com/algebra.pdf",
    ogTitle: "Algebra Lineal - PDF",
    ogDescription: null,
    ogImage: null,
    ogScrapedAt: null,
    fileUrl: null,
    fileName: null,
    fileType: null,
    fileSizeKb: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    profiles: { fullName: "Carlos Mendez", avatarUrl: "https://example.com/avatar.png" },
    subjects: { name: "Matematicas" },
  };

  const sampleListResult = { rows: [sampleResource], total: 1 };

  const listStudyResources: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleListResult),
  };
  const getStudyResourceById: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleResource),
  };
  const createStudyResource: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleResource),
  };
  const updateStudyResource: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleResource),
  };
  const deleteStudyResource: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(true),
  };

  const controller = new ResourcesController(
    listStudyResources as never,
    getStudyResourceById as never,
    createStudyResource as never,
    updateStudyResource as never,
    deleteStudyResource as never,
  );

  return {
    server: createResourcesServer(controller),
    listStudyResources,
    getStudyResourceById,
    createStudyResource,
    updateStudyResource,
    deleteStudyResource,
  };
}

describe("Resources integration /api/v1/resources", () => {
  describe("POST /api/v1/resources", () => {
    it("crea un recurso when body cumple el contrato (AAA)", async () => {
      const { server, createStudyResource } = buildResourcesServer();

      const validBody = {
        title: "Algebra Lineal",
        description: "Libro de algebra para ingenieria",
        url: "https://example.com/algebra.pdf",
        subjectId: SUBJECT_ID,
        tags: ["matematicas", "algebra"],
        isPublic: true,
      };

      const requestParse = CreateResourceRequestSchema.safeParse({ body: validBody });
      expect(requestParse.success).toBe(true);

      const response = await request(server as any)
        .post("/api/v1/resources")
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send(validBody)
        .expect(201);

      expect(createStudyResource.execute).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("resource");
      expect(response.body.resource.id).toBe(UUID);
      expect(response.body.resource.title).toBe("Algebra Lineal");

      const contractResult = CreateResourceContract.response.safeParse(response.body);
      expect(contractResult.success).toBe(true);
    });

    it("rechaza body sin title con 400", async () => {
      const { server, createStudyResource } = buildResourcesServer();

      const response = await request(server as any)
        .post("/api/v1/resources")
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send({
          url: "https://example.com/recurso.pdf",
          subjectId: SUBJECT_ID,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(createStudyResource.execute).not.toHaveBeenCalled();
    });

    it("rechaza request sin x-user-id con 401", async () => {
      const { server, createStudyResource } = buildResourcesServer();

      await request(server as any)
        .post("/api/v1/resources")
        .set("Content-Type", "application/json")
        .send({
          title: "Test",
          url: "https://example.com/test.pdf",
          subjectId: SUBJECT_ID,
        })
        .expect(401);

      expect(createStudyResource.execute).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/resources", () => {
    it("lista recursos y response tiene data array", async () => {
      const { server, listStudyResources } = buildResourcesServer();

      const response = await request(server as any)
        .get("/api/v1/resources")
        .expect(200);

      expect(listStudyResources.execute).toHaveBeenCalledTimes(1);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].id).toBe(UUID);
      expect(response.body).toHaveProperty("meta");
      expect(response.body.meta).toHaveProperty("total");
    });
  });

  describe("GET /api/v1/resources/:id", () => {
    it("obtiene recurso por id", async () => {
      const { server, getStudyResourceById } = buildResourcesServer();

      const response = await request(server as any)
        .get(`/api/v1/resources/${UUID}`)
        .expect(200);

      expect(getStudyResourceById.execute).toHaveBeenCalledWith(UUID);
      expect(response.body.data.id).toBe(UUID);
    });

    it("responde 404 cuando recurso no existe", async () => {
      const { server, getStudyResourceById } = buildResourcesServer();
      getStudyResourceById.execute.mockResolvedValueOnce(null);

      await request(server as any)
        .get(`/api/v1/resources/${UUID}`)
        .expect(404);
    });
  });

  describe("DELETE /api/v1/resources/:id", () => {
    it("elimina recurso y responde 200", async () => {
      const { server, deleteStudyResource } = buildResourcesServer();

      const response = await request(server as any)
        .delete(`/api/v1/resources/${UUID}`)
        .set("x-user-id", USER_ID)
        .expect(200);

      expect(deleteStudyResource.execute).toHaveBeenCalledWith(UUID, USER_ID);
      expect(response.body.data.message).toBe("Recurso eliminado correctamente.");
    });

    it("responde 404 cuando recurso a eliminar no existe", async () => {
      const { server, deleteStudyResource } = buildResourcesServer();
      deleteStudyResource.execute.mockResolvedValueOnce(false);

      await request(server as any)
        .delete(`/api/v1/resources/${UUID}`)
        .set("x-user-id", USER_ID)
        .expect(404);
    });
  });

  describe("PUT /api/v1/resources/:id", () => {
    it("actualiza recurso y responde 200", async () => {
      const { server, updateStudyResource } = buildResourcesServer();

      await request(server as any)
        .put(`/api/v1/resources/${UUID}`)
        .set("Content-Type", "application/json")
        .set("x-user-id", USER_ID)
        .send({ title: "Nuevo titulo", description: "Nueva descripcion" })
        .expect(200);

      expect(updateStudyResource.execute).toHaveBeenCalled();
    });
  });

  it("GET /health responde 200", async () => {
    const { server } = buildResourcesServer();
    const response = await request(server as any).get("/health").expect(200);
    expect(response.body.service).toBe("resources");
    expect(response.body.status).toBe("ok");
  });
});
