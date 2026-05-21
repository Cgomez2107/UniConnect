import { z } from "zod";
import { OpenAPIBuilder, dataResponse, dataListResponse, messageResponse, statusResponse } from "../../../../shared/contracts/openapi/index.js";

const UuidSchema = z.string().uuid();

const EventDataSchema = z.object({
  id: UuidSchema,
  title: z.string(),
  description: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  location: z.string().optional(),
  organizerId: z.string(),
  organizerName: z.string().optional(),
  maxCapacity: z.number().int().positive().optional(),
  registeredCount: z.number().int().nonnegative().optional(),
  category: z.string(),
  imageUrl: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CreateEventBodySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  category: z.enum(["academico", "cultural", "deportivo", "otro"]),
  eventDate: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  location: z.string().max(300).optional(),
  maxCapacity: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
});

const UpdateEventBodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  eventDate: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  location: z.string().max(300).optional(),
  maxCapacity: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
});

const SubscribeBodySchema = z.object({
  categoria: z.enum(["academico", "cultural", "deportivo", "otro"]),
});

const UnsubscribeBodySchema = z.object({
  categoria: z.enum(["academico", "cultural", "deportivo", "otro"]),
});

const SubscriptionListResponseSchema = z.object({
  userId: z.string(),
  categories: z.array(z.string()),
});

const builder = new OpenAPIBuilder({
  title: "UniConnect Events Service",
  version: "0.1.0",
  serverUrl: "http://localhost:3106",
  basePath: "/api/v1",
});

builder.addTag("Events", "Eventos académicos y calendario");

builder.addEndpoint("/events", "get", {
  summary: "Listar eventos académicos",
  description: "Obtiene una lista de eventos. Puede filtrarse por próximos (upcoming).",
  tags: ["Events"],
  querySchema: z.object({
    upcoming: z.coerce.boolean().optional(),
  }),
  responses: {
    200: { description: "Lista de eventos obtenida exitosamente", schema: dataListResponse(EventDataSchema) },
  },
});

builder.addEndpoint("/events", "post", {
  summary: "Crear un evento",
  description: "Crea un nuevo evento académico.",
  tags: ["Events"],
  bodySchema: CreateEventBodySchema,
  responses: {
    201: { description: "Evento creado exitosamente", schema: dataResponse(EventDataSchema) },
    400: { description: "Error de validación" },
  },
});

builder.addEndpoint("/events/:id", "get", {
  summary: "Obtener evento por ID",
  description: "Retorna la información detallada de un evento específico.",
  tags: ["Events"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Evento encontrado", schema: dataResponse(EventDataSchema) },
    404: { description: "Evento no encontrado" },
  },
});

builder.addEndpoint("/events/:id", "put", {
  summary: "Actualizar un evento",
  description: "Actualiza los datos de un evento existente.",
  tags: ["Events"],
  paramsSchema: z.object({ id: UuidSchema }),
  bodySchema: UpdateEventBodySchema,
  responses: {
    200: { description: "Evento actualizado exitosamente", schema: dataResponse(EventDataSchema) },
    400: { description: "Error de validación" },
    404: { description: "Evento no encontrado" },
  },
});

builder.addEndpoint("/events/:id", "delete", {
  summary: "Eliminar un evento",
  description: "Elimina un evento académico.",
  tags: ["Events"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Evento eliminado exitosamente", schema: messageResponse() },
    404: { description: "Evento no encontrado" },
  },
});

builder.addEndpoint("/eventos/suscribir", "post", {
  summary: "Suscribirse a una categoría de eventos",
  description: "Suscribe al usuario autenticado a una categoría de eventos para recibir notificaciones.",
  tags: ["Events"],
  bodySchema: SubscribeBodySchema,
  responses: {
    201: { description: "Suscripción exitosa", schema: statusResponse() },
    400: { description: "Error de validación — categoría inválida" },
  },
});

builder.addEndpoint("/eventos/suscripciones", "get", {
  summary: "Obtener suscripciones del usuario",
  description: "Retorna las categorías de eventos a las que el usuario autenticado está suscrito.",
  tags: ["Events"],
  responses: {
    200: { description: "Suscripciones obtenidas exitosamente", schema: dataResponse(SubscriptionListResponseSchema) },
  },
});

builder.addEndpoint("/eventos/suscribir", "delete", {
  summary: "Desuscribirse de una categoría",
  description: "Elimina la suscripción del usuario autenticado a una categoría de eventos.",
  tags: ["Events"],
  bodySchema: UnsubscribeBodySchema,
  responses: {
    200: { description: "Desuscripción exitosa", schema: statusResponse() },
    400: { description: "Error de validación" },
  },
});

builder.toFile("src/openapi/openapi.partial.json");
