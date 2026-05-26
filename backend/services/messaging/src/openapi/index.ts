import { z } from "zod";
import { OpenAPIBuilder, dataResponse, dataListResponse, messageResponse } from "../../../../shared/contracts/openapi/index.js";

// ===== Polls schemas =====

const CreatePollBodySchema = z.object({
  messageId: z.string().min(1, "messageId es requerido"),
  groupId: z.string().min(1, "groupId es requerido"),
  question: z
    .string()
    .min(5, "question debe tener al menos 5 caracteres")
    .max(500, "question debe tener máximo 500 caracteres"),
  options: z
    .array(z.string().min(1))
    .min(2, "options debe tener al menos 2 opciones")
    .max(10, "options debe tener máximo 10 opciones"),
  expiresAt: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "expiresAt debe ser una fecha ISO 8601 válida" },
  ),
});

const PollOptionResultSchema = z.object({
  option: z.string(),
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

const CreatePollResponseSchema = z.object({
  pollId: z.string().uuid(),
  messageId: z.string().uuid(),
  groupId: z.string().uuid(),
  createdBy: z.string().uuid(),
  question: z.string(),
  options: z.array(z.string()),
  expiresAt: z.string(),
  status: z.enum(["active", "closed"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  results: z.array(PollOptionResultSchema),
  totalVotes: z.number().int().nonnegative(),
});

const CastVoteBodySchema = z.object({
  selectedOption: z
    .number()
    .int()
    .min(0, "selectedOption debe ser un entero >= 0"),
});

const CastVoteResponseSchema = z.object({
  success: z.boolean(),
  pollId: z.string().uuid(),
  userId: z.string().uuid(),
  selectedOption: z.number().int(),
  results: z.array(PollOptionResultSchema),
  totalVotes: z.number().int().nonnegative(),
});

const DuplicateVoteErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string(),
});

const GetPollResultsResponseSchema = z.object({
  pollId: z.string().uuid(),
  question: z.string(),
  status: z.enum(["active", "closed"]),
  results: z.array(PollOptionResultSchema),
  totalVotes: z.number().int().nonnegative(),
});

// ===== Conversation schemas =====

const ConversationSummarySchema = z.object({
  id: z.string().uuid(),
  participantA: z.string().uuid(),
  participantB: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastMessage: z.string().nullable(),
  lastMessageAt: z.string().datetime().nullable(),
  unreadCount: z.number().int().nonnegative(),
});

const CreateConversationBodySchema = z.object({
  participantB: z.string().min(1),
});

// ===== Message schemas =====

const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  mediaUrl: z.string().nullable().optional(),
  mediaType: z.string().nullable().optional(),
  mediaFilename: z.string().nullable().optional(),
  replyToMessageId: z.string().nullable().optional(),
  replyPreview: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().nullable(),
});

const CreateMessageBodySchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().optional().default(""),
  mediaUrl: z.string().optional(),
  mediaType: z.string().optional(),
  mediaFilename: z.string().optional(),
  replyToMessageId: z.string().optional(),
  replyPreview: z.string().optional(),
});

const UnreadCountSchema = z.object({
  count: z.number().int().nonnegative(),
});

const ToggleReactionBodySchema = z.object({
  emoji: z.string().min(1),
});

const ToggleReactionResponseSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  reactions: z.array(z.object({
    emoji: z.string(),
    userId: z.string(),
  })),
});

const MarkReadResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  message: z.string(),
});

const builder = new OpenAPIBuilder({
  title: "UniConnect Messaging Service",
  version: "0.1.0",
  serverUrl: "http://localhost:3104",
  basePath: "/api/v1",
});

builder.addTag("Messaging", "Mensajería y conversaciones");
builder.addTag("Polls", "Encuestas en mensajes de grupo");

// ===== Conversation endpoints =====

builder.addEndpoint("/conversations", "get", {
  summary: "Listar conversaciones",
  description:
    "Obtiene todas las conversaciones del usuario autenticado, incluyendo el último mensaje y conteo de no leídos.",
  tags: ["Messaging"],
  responses: {
    200: {
      description: "Lista de conversaciones obtenida exitosamente",
      schema: dataListResponse(ConversationSummarySchema),
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

builder.addEndpoint("/conversations", "post", {
  summary: "Obtener o crear conversación",
  description:
    "Obtiene una conversación existente con el participante indicado o crea una nueva.",
  tags: ["Messaging"],
  bodySchema: CreateConversationBodySchema,
  responses: {
    200: {
       description: "Conversación existente encontrada",
       schema: dataResponse(ConversationSummarySchema),
     },
     201: {
       description: "Conversación creada exitosamente",
       schema: dataResponse(ConversationSummarySchema),
    },
    400: {
      description: "Error de validación",
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

builder.addEndpoint("/conversations/:id", "get", {
  summary: "Obtener conversación por ID",
  description:
    "Retorna una conversación específica si el usuario autenticado es participante.",
  tags: ["Messaging"],
  paramsSchema: z.object({
    id: z.string().uuid(),
  }),
  responses: {
    200: {
       description: "Conversación encontrada",
       schema: dataResponse(ConversationSummarySchema),
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
    404: {
      description: "Conversación no encontrada",
    },
  },
});

builder.addEndpoint("/conversations/:id/touch", "patch", {
  summary: "Actualizar timestamp de conversación",
  description:
    "Actualiza el timestamp updated_at de una conversación (ej. al escribir o previsualizar).",
  tags: ["Messaging"],
  paramsSchema: z.object({
    id: z.string().uuid(),
  }),
  responses: {
    200: {
      description: "Conversación actualizada",
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

builder.addEndpoint("/conversations/:id/read", "patch", {
  summary: "Marcar conversación como leída",
  description:
    "Marca todos los mensajes no leídos de una conversación como leídos para el usuario autenticado.",
  tags: ["Messaging"],
  paramsSchema: z.object({
    id: z.string().uuid(),
  }),
  responses: {
    200: {
       description: "Conversación marcada como leída",
       schema: dataResponse(MarkReadResponseSchema),
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

// ===== Message endpoints =====

builder.addEndpoint("/messages/unread-count", "get", {
  summary: "Obtener conteo de no leídos",
  description:
    "Retorna el número total de mensajes no leídos en todas las conversaciones del usuario.",
  tags: ["Messaging"],
  responses: {
    200: {
       description: "Conteo obtenido exitosamente",
       schema: dataResponse(UnreadCountSchema),
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

builder.addEndpoint("/messages", "get", {
  summary: "Listar mensajes de una conversación",
  description:
    "Obtiene los mensajes de una conversación con paginación.",
  tags: ["Messaging"],
  querySchema: z.object({
    conversationId: z.string().min(1),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
    offset: z.coerce.number().int().nonnegative().default(0).optional(),
  }),
  responses: {
    200: {
      description: "Lista de mensajes obtenida exitosamente",
      schema: dataListResponse(MessageSchema),
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

builder.addEndpoint("/messages", "post", {
  summary: "Enviar un mensaje",
  description:
    "Envía un mensaje de texto (opcionalmente con adjuntos multimedia o respuesta a otro mensaje) en una conversación.",
  tags: ["Messaging"],
  bodySchema: CreateMessageBodySchema,
  responses: {
    201: {
       description: "Mensaje creado exitosamente",
       schema: dataResponse(MessageSchema),
    },
    400: {
      description: "Error de validación",
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

builder.addEndpoint("/messages/:id", "get", {
  summary: "Obtener mensaje por ID",
  description:
    "Retorna un mensaje específico por su ID.",
  tags: ["Messaging"],
  paramsSchema: z.object({
    id: z.string().uuid(),
  }),
  responses: {
    200: {
       description: "Mensaje encontrado",
       schema: dataResponse(MessageSchema),
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
    404: {
      description: "Mensaje no encontrado",
    },
  },
});

builder.addEndpoint("/messages/:id/reactions", "post", {
  summary: "Agregar o quitar reacción",
  description:
    "Alterna una reacción con emoji en un mensaje. Si el usuario ya reaccionó con ese emoji, se elimina; si no, se agrega.",
  tags: ["Messaging"],
  paramsSchema: z.object({
    id: z.string().uuid(),
  }),
  bodySchema: ToggleReactionBodySchema,
  responses: {
    200: {
       description: "Reacción actualizada",
       schema: dataResponse(ToggleReactionResponseSchema),
    },
    400: {
      description: "El campo emoji es requerido",
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

builder.addEndpoint("/messages/:id/read", "patch", {
  summary: "Marcar mensaje como leído",
  description:
    "Marca un mensaje individual como leído estableciendo el timestamp read_at.",
  tags: ["Messaging"],
  paramsSchema: z.object({
    id: z.string().uuid(),
  }),
  responses: {
    200: {
      description: "Mensaje marcado como leído",
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
    404: {
      description: "Mensaje no encontrado",
    },
  },
});

// ===== Poll endpoints =====

builder.addEndpoint("/polls", "post", {
  summary: "Crear una encuesta en un mensaje de grupo",
  description:
    "Crea una encuesta asociada a un mensaje existente en un grupo de estudio. El usuario autenticado debe ser miembro del grupo.",
  tags: ["Polls"],
  bodySchema: CreatePollBodySchema,
  responses: {
    201: {
       description: "Encuesta creada exitosamente",
       schema: dataResponse(CreatePollResponseSchema),
    },
    400: {
      description: "Error de validación — datos de entrada inválidos",
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

builder.addEndpoint("/polls/:pollId/votes", "post", {
  summary: "Emitir un voto en una encuesta activa",
  description:
    "Registra el voto de un usuario en una opción de una encuesta activa. Cada usuario solo puede votar una vez.",
  tags: ["Polls"],
  paramsSchema: z.object({
    pollId: z.string().uuid(),
  }),
  bodySchema: CastVoteBodySchema,
  responses: {
    200: {
       description: "Voto registrado exitosamente",
       schema: dataResponse(CastVoteResponseSchema),
    },
    400: {
      description:
        "Error del negocio — voto duplicado, encuesta cerrada u opción inválida",
      schema: DuplicateVoteErrorSchema,
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
  },
});

builder.addEndpoint("/polls/:pollId/results", "get", {
  summary: "Obtener resultados actuales de una encuesta",
  description:
    "Retorna los resultados agregados de una encuesta, incluyendo el conteo de votos por opción y el total de votos.",
  tags: ["Polls"],
  paramsSchema: z.object({
    pollId: z.string().uuid(),
  }),
  responses: {
    200: {
       description: "Resultados de la encuesta obtenidos exitosamente",
       schema: dataResponse(GetPollResultsResponseSchema),
    },
    401: {
      description: "Token de autenticación requerido o inválido",
    },
    404: {
      description: "Encuesta no encontrada",
    },
  },
});

builder.toFile("src/openapi/openapi.partial.json");