import { z } from "zod";
import { OpenAPIBuilder, dataResponse, dataListResponse, messageResponse } from "../../../../shared/contracts/openapi/index.js";
import { StudyGroupSchema, SubjectSchema } from "@uniconnect/shared-types";

const UuidSchema = z.string().uuid();

const CreateGroupBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  subjectId: UuidSchema,
  maxMembers: z.number().int().positive().max(50),
});

const MemberSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  groupId: UuidSchema,
  role: z.enum(["admin", "member"]),
  joinedAt: z.string().datetime(),
  profile: z.object({
    fullName: z.string(),
    avatarUrl: z.string().url().nullable(),
  }).optional(),
});

const ApplicationSchema = z.object({
  id: UuidSchema,
  groupId: UuidSchema,
  userId: UuidSchema,
  status: z.enum(["pending", "approved", "rejected"]),
  message: z.string().optional(),
  createdAt: z.string().datetime(),
});

const ReviewApplicationBodySchema = z.object({
  status: z.enum(["aceptada", "rechazada"]),
});

const MessageSchema = z.object({
  id: UuidSchema,
  groupId: UuidSchema,
  senderId: UuidSchema,
  content: z.string(),
  createdAt: z.string().datetime(),
});

const CreateMessageBodySchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrl: z.string().optional(),
  mediaType: z.string().optional(),
  mediaFilename: z.string().optional(),
  mentions: z.array(z.string()).optional(),
});

const ApplyBodySchema = z.object({
  message: z.string().max(500).optional(),
});

const TransferBodySchema = z.object({
  targetUserId: UuidSchema,
});

const NotificationSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  type: z.string(),
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  createdAt: z.string().datetime(),
});

const SessionSchema = z.object({
  id: UuidSchema,
  groupId: UuidSchema,
  title: z.string(),
  description: z.string().optional(),
  dateTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  location: z.string().optional(),
  createdBy: UuidSchema,
  createdAt: z.string().datetime(),
});

const CreateSessionBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dateTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  location: z.string().max(200).optional(),
});

const AttendeeSchema = z.object({
  userId: UuidSchema,
  userName: z.string(),
  available: z.boolean(),
});

const AvailabilityBodySchema = z.object({
  status: z.enum(["confirmed", "declined"]),
});

const ToggleReactionBodySchema = z.object({
  emoji: z.string().min(1),
});

const builder = new OpenAPIBuilder({
  title: "UniConnect Study Groups Service",
  version: "0.1.0",
  serverUrl: "http://localhost:3101",
  basePath: "/api/v1",
});

builder.addTag("Study Groups", "Gestión de grupos de estudio");

builder.addEndpoint("/study-groups", "get", {
  summary: "Listar grupos de estudio",
  description: "Obtiene una lista paginada de grupos de estudio disponibles. Puede filtrarse por materia.",
  tags: ["Study Groups"],
  querySchema: z.object({
    page: z.coerce.number().int().positive().default(1).optional(),
    limit: z.coerce.number().int().positive().max(100).default(20).optional(),
    subjectId: UuidSchema.optional(),
  }),
  responses: {
    200: { description: "Lista de grupos obtenida exitosamente", schema: dataListResponse(StudyGroupSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups", "post", {
  summary: "Crear un grupo de estudio",
  description: "Crea un nuevo grupo de estudio. El usuario autenticado se convierte en administrador del grupo.",
  tags: ["Study Groups"],
  bodySchema: CreateGroupBodySchema,
  responses: {
    201: { description: "Grupo creado exitosamente", schema: dataResponse(StudyGroupSchema) },
    400: { description: "Error de validación — datos de entrada inválidos" },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups/me", "get", {
  summary: "Obtener grupos del usuario",
  description: "Retorna los grupos de estudio a los que pertenece el usuario autenticado.",
  tags: ["Study Groups"],
  responses: {
    200: { description: "Grupos del usuario obtenidos exitosamente", schema: dataListResponse(StudyGroupSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups/applications", "get", {
  summary: "Obtener solicitudes del usuario",
  description: "Retorna las solicitudes de membresía realizadas por el usuario autenticado.",
  tags: ["Study Groups"],
  responses: {
    200: { description: "Solicitudes obtenidas exitosamente", schema: dataListResponse(ApplicationSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups/:id", "get", {
  summary: "Obtener detalle de un grupo",
  description: "Retorna la información detallada de un grupo de estudio específico.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Grupo encontrado", schema: dataResponse(StudyGroupSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
    404: { description: "Grupo no encontrado" },
  },
});

builder.addEndpoint("/study-groups/:id/members", "get", {
  summary: "Listar miembros del grupo",
  description: "Obtiene la lista de miembros de un grupo de estudio.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Miembros obtenidos exitosamente", schema: dataListResponse(MemberSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
    404: { description: "Grupo no encontrado" },
  },
});

builder.addEndpoint("/study-groups/:id/applications", "get", {
  summary: "Listar solicitudes del grupo",
  description: "Obtiene las solicitudes de membresía pendientes para un grupo. Solo el administrador puede verlas.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Solicitudes obtenidas exitosamente", schema: dataListResponse(ApplicationSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
    403: { description: "No autorizado — solo el administrador puede ver solicitudes" },
  },
});

builder.addEndpoint("/study-groups/:id/messages", "get", {
  summary: "Listar mensajes del grupo",
  description: "Obtiene los mensajes del chat de un grupo de estudio.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Mensajes obtenidos exitosamente", schema: dataListResponse(MessageSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups/:id/messages", "post", {
  summary: "Enviar mensaje al grupo",
  description: "Envía un mensaje al chat del grupo de estudio.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  bodySchema: CreateMessageBodySchema,
  responses: {
    201: { description: "Mensaje enviado exitosamente", schema: dataResponse(MessageSchema) },
    400: { description: "Error de validación" },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups/:id/apply", "post", {
  summary: "Solicitar membresía",
  description: "Envía una solicitud para unirse a un grupo de estudio.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  bodySchema: ApplyBodySchema,
  responses: {
    201: { description: "Solicitud enviada exitosamente" },
    400: { description: "Error de validación" },
    401: { description: "Token de autenticación requerido o inválido" },
    409: { description: "Ya existe una solicitud pendiente o el usuario ya es miembro" },
  },
});

builder.addEndpoint("/study-groups/:id/leave", "post", {
  summary: "Abandonar grupo",
  description: "Elimina al usuario autenticado del grupo de estudio.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Has abandonado el grupo exitosamente" },
    401: { description: "Token de autenticación requerido o inválido" },
    404: { description: "Grupo no encontrado" },
  },
});

builder.addEndpoint("/study-groups/:id/cancel", "post", {
  summary: "Cancelar solicitud",
  description: "Cancela una solicitud de membresía pendiente.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Solicitud cancelada exitosamente" },
    401: { description: "Token de autenticación requerido o inválido" },
    404: { description: "Solicitud no encontrada" },
  },
});

builder.addEndpoint("/study-groups/:id/transfer", "post", {
  summary: "Transferir administración",
  description: "Transfiere el rol de administrador del grupo a otro miembro.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  bodySchema: TransferBodySchema,
  responses: {
    200: { description: "Administración transferida exitosamente" },
    400: { description: "Error de validación" },
    401: { description: "Token de autenticación requerido o inválido" },
    403: { description: "No autorizado — solo el administrador puede transferir" },
  },
});

builder.addEndpoint("/study-groups/applications/:applicationId/review", "put", {
  summary: "Revisar solicitud de membresía",
  description: "Aprueba o rechaza una solicitud de membresía. Solo el administrador del grupo puede hacer esto.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ applicationId: UuidSchema }),
  bodySchema: ReviewApplicationBodySchema,
  responses: {
    200: { description: "Solicitud revisada exitosamente" },
    400: { description: "Error de validación" },
    401: { description: "Token de autenticación requerido o inválido" },
    403: { description: "No autorizado" },
  },
});

builder.addEndpoint("/study-groups/transfers/:transferId/accept", "post", {
  summary: "Aceptar transferencia",
  description: "Acepta la transferencia de administración de un grupo.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ transferId: UuidSchema }),
  responses: {
    200: { description: "Transferencia aceptada exitosamente" },
    401: { description: "Token de autenticación requerido o inválido" },
    404: { description: "Transferencia no encontrada" },
  },
});

builder.addEndpoint("/study-groups/transfers/:transferId/reject", "post", {
  summary: "Rechazar transferencia",
  description: "Rechaza la transferencia de administración de un grupo.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ transferId: UuidSchema }),
  responses: {
    200: { description: "Transferencia rechazada" },
    401: { description: "Token de autenticación requerido o inválido" },
    404: { description: "Transferencia no encontrada" },
  },
});

builder.addEndpoint("/study-groups/:id/messages/:messageId/reactions", "post", {
  summary: "Reaccionar a un mensaje",
  description: "Agrega o elimina una reacción con emoji en un mensaje del grupo.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema, messageId: UuidSchema }),
  bodySchema: ToggleReactionBodySchema,
  responses: {
    200: { description: "Reacción actualizada exitosamente" },
    400: { description: "El campo emoji es requerido" },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups/:id/sessions", "get", {
  summary: "Listar sesiones del grupo",
  description: "Obtiene las sesiones de estudio programadas para un grupo.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  responses: {
    200: { description: "Sesiones obtenidas exitosamente", schema: dataListResponse(SessionSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups/:id/sessions", "post", {
  summary: "Crear sesión de estudio",
  description: "Programa una nueva sesión de estudio para el grupo.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema }),
  bodySchema: CreateSessionBodySchema,
  responses: {
    201: { description: "Sesión creada exitosamente", schema: dataResponse(SessionSchema) },
    400: { description: "Error de validación" },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups/:id/sessions/:sessionId", "delete", {
  summary: "Eliminar sesión",
  description: "Elimina una sesión de estudio programada. Solo el creador o administrador puede hacerlo.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema, sessionId: UuidSchema }),
  responses: {
    200: { description: "Sesión eliminada exitosamente" },
    401: { description: "Token de autenticación requerido o inválido" },
    403: { description: "No autorizado" },
    404: { description: "Sesión no encontrada" },
  },
});

builder.addEndpoint("/study-groups/:id/sessions/:sessionId/availability", "post", {
  summary: "Confirmar disponibilidad",
  description: "Confirma o cancela la disponibilidad del usuario autenticado para una sesión.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema, sessionId: UuidSchema }),
  bodySchema: AvailabilityBodySchema,
  responses: {
    200: { description: "Disponibilidad actualizada" },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/study-groups/:id/sessions/:sessionId/attendees", "get", {
  summary: "Listar asistentes de sesión",
  description: "Obtiene la lista de asistentes confirmados para una sesión de estudio.",
  tags: ["Study Groups"],
  paramsSchema: z.object({ id: UuidSchema, sessionId: UuidSchema }),
  responses: {
    200: { description: "Asistentes obtenidos exitosamente", schema: dataListResponse(AttendeeSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/notifications", "get", {
  summary: "Listar notificaciones",
  description: "Obtiene las notificaciones del usuario autenticado relacionadas con grupos de estudio.",
  tags: ["Study Groups"],
  responses: {
    200: { description: "Notificaciones obtenidas exitosamente", schema: dataListResponse(NotificationSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.toFile("src/openapi/openapi.partial.json");