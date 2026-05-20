import { z } from "zod";
import { OpenAPIBuilder, dataResponse, dataListResponse } from "../../../../shared/contracts/openapi/index.js";

const UuidSchema = z.string().uuid();

const ResourceSchema = z.object({
  id: UuidSchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  resourceType: z.enum(["file", "link"]).optional(),
  url: z.string().url().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSizeKb: z.number().int().positive().optional(),
  subjectId: UuidSchema.optional(),
  programId: UuidSchema.optional(),
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CreateResourceBodySchema = z.object({
  resourceType: z.enum(["file", "link"]).optional(),
  programId: UuidSchema.optional(),
  subjectId: UuidSchema.optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  url: z.string().url().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSizeKb: z.number().int().positive().optional(),
});

const UpdateResourceBodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
});

const builder = new OpenAPIBuilder({
  title: "UniConnect Resources Service",
  version: "0.1.0",
  serverUrl: "http://localhost:3103",
  basePath: "/api/v1",
});

builder.addTag("Resources", "Recursos académicos compartidos");

builder.addEndpoint("/resources", "get", {
  summary: "Listar recursos académicos",
  description: "Obtiene una lista paginada de recursos compartidos. Puede filtrarse por materia o tipo de recurso.",
  tags: ["Resources"],
  querySchema: z.object({
    page: z.coerce.number().int().positive().default(1).optional(),
    limit: z.coerce.number().int().positive().max(50).default(20).optional(),
    subjectId: UuidSchema.optional(),
    resourceType: z.enum(["file", "link"]).optional(),
    search: z.string().max(200).optional(),
    userId: UuidSchema.optional(),
  }),
  responses: {
    200: { description: "Lista de recursos obtenida exitosamente", schema: dataListResponse(ResourceSchema) },
  },
});

builder.addEndpoint("/resources", "post", {
  summary: "Crear un recurso",
  description: "Crea un nuevo recurso académico compartido (archivo o enlace).",
  tags: ["Resources"],
  bodySchema: CreateResourceBodySchema,
  responses: {
    201: { description: "Recurso creado exitosamente", schema: dataResponse(ResourceSchema) },
    400: { description: "Error de validación — datos de entrada inválidos" },
  },
});

builder.addEndpoint("/resources/:id", "get", {
  summary: "Obtener recurso por ID",
  description: "Retorna un recurso académico específico por su ID.",
  tags: ["Resources"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Recurso encontrado", schema: dataResponse(ResourceSchema) },
    404: { description: "Recurso no encontrado" },
  },
});

builder.addEndpoint("/resources/:id", "put", {
  summary: "Actualizar un recurso",
  description: "Actualiza los campos editables de un recurso académico existente.",
  tags: ["Resources"],
  paramsSchema: z.object({ id: UuidSchema }),
  bodySchema: UpdateResourceBodySchema,
  responses: {
    200: { description: "Recurso actualizado exitosamente", schema: dataResponse(ResourceSchema) },
    400: { description: "Error de validación" },
    404: { description: "Recurso no encontrado" },
  },
});

builder.addEndpoint("/resources/:id", "delete", {
  summary: "Eliminar un recurso",
  description: "Elimina un recurso académico compartido.",
  tags: ["Resources"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Recurso eliminado exitosamente" },
    404: { description: "Recurso no encontrado" },
  },
});

builder.toFile("src/openapi/openapi.partial.json");
