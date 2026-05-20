import { z } from "zod";
import { OpenAPIBuilder, dataResponse, dataListResponse, messageResponse } from "../../../../shared/contracts/openapi/index.js";

const UuidSchema = z.string().uuid();

const QuestionSummarySchema = z.object({
  id: UuidSchema,
  title: z.string(),
  authorId: UuidSchema,
  subjectId: UuidSchema.optional(),
  status: z.string(),
  answerCount: z.number().int().nonnegative(),
  voteCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const QuestionDetailSchema = z.object({
  id: UuidSchema,
  title: z.string(),
  body: z.string(),
  authorId: UuidSchema,
  subjectId: UuidSchema.optional(),
  status: z.string(),
  answerCount: z.number().int().nonnegative(),
  voteCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const AnswerSchema = z.object({
  id: UuidSchema,
  questionId: UuidSchema,
  authorId: UuidSchema,
  body: z.string(),
  voteCount: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const QuestionDetailResponseSchema = z.object({
  question: QuestionDetailSchema,
  answers: z.array(AnswerSchema),
});

const CreateQuestionBodySchema = z.object({
  subjectId: UuidSchema.optional(),
  title: z.string().min(10).max(300),
  body: z.string().min(1).max(5000),
});

const CreateAnswerBodySchema = z.object({
  body: z.string().min(1).max(5000),
});

const MarkSolutionBodySchema = z.object({
  answerId: UuidSchema,
});

const CastVoteBodySchema = z.object({
  targetType: z.enum(["question", "answer"]),
  targetId: UuidSchema,
  voteType: z.enum(["upvote", "downvote"]),
});

const builder = new OpenAPIBuilder({
  title: "UniConnect Academic Q&A Service",
  version: "0.1.0",
  serverUrl: "http://localhost:3107",
  basePath: "/api/v1",
});

builder.addTag("Academic Q&A", "Foro académico de preguntas y respuestas");

builder.addEndpoint("/forum/questions", "get", {
  summary: "Listar preguntas del foro académico",
  description: "Obtiene una lista paginada de preguntas del foro. Puede filtrarse por materia.",
  tags: ["Academic Q&A"],
  querySchema: z.object({
    page: z.coerce.number().int().positive().default(1).optional(),
    limit: z.coerce.number().int().positive().max(100).default(20).optional(),
    subjectId: UuidSchema.optional(),
  }),
  responses: {
    200: { description: "Lista de preguntas obtenida exitosamente", schema: dataListResponse(QuestionSummarySchema) },
  },
});

builder.addEndpoint("/forum/questions", "post", {
  summary: "Crear una nueva pregunta",
  description: "Publica una nueva pregunta en el foro académico. El usuario autenticado aparece como autor.",
  tags: ["Academic Q&A"],
  bodySchema: CreateQuestionBodySchema,
  responses: {
    201: { description: "Pregunta creada exitosamente", schema: dataResponse(QuestionDetailSchema) },
    400: { description: "Error de validación — datos de entrada inválidos" },
  },
});

builder.addEndpoint("/forum/questions/:questionId", "get", {
  summary: "Obtener detalle de una pregunta",
  description: "Retorna una pregunta específica con todas sus respuestas.",
  tags: ["Academic Q&A"],
  paramsSchema: z.object({ questionId: UuidSchema }),
  responses: {
    200: { description: "Detalle de la pregunta obtenido exitosamente", schema: dataResponse(QuestionDetailResponseSchema) },
    404: { description: "Pregunta no encontrada" },
  },
});

builder.addEndpoint("/forum/questions/:questionId/answers", "get", {
  summary: "Listar respuestas de una pregunta",
  description: "Obtiene todas las respuestas asociadas a una pregunta específica.",
  tags: ["Academic Q&A"],
  paramsSchema: z.object({ questionId: UuidSchema }),
  responses: {
    200: { description: "Lista de respuestas obtenida exitosamente", schema: dataListResponse(AnswerSchema) },
    404: { description: "Pregunta no encontrada" },
  },
});

builder.addEndpoint("/forum/questions/:questionId/answers", "post", {
  summary: "Crear una respuesta",
  description: "Publica una respuesta a una pregunta existente en el foro.",
  tags: ["Academic Q&A"],
  paramsSchema: z.object({ questionId: UuidSchema }),
  bodySchema: CreateAnswerBodySchema,
  responses: {
    201: { description: "Respuesta creada exitosamente", schema: dataResponse(AnswerSchema) },
    400: { description: "Error de validación — datos de entrada inválidos" },
    404: { description: "Pregunta no encontrada" },
  },
});

builder.addEndpoint("/forum/questions/:questionId/solution", "post", {
  summary: "Marcar respuesta como solución",
  description: "Marca una respuesta como la solución aceptada de una pregunta. Solo el autor de la pregunta puede marcar la solución.",
  tags: ["Academic Q&A"],
  paramsSchema: z.object({ questionId: UuidSchema }),
  bodySchema: MarkSolutionBodySchema,
  responses: {
    200: { description: "Solución marcada exitosamente", schema: messageResponse() },
    400: { description: "Error de validación" },
    404: { description: "Pregunta o respuesta no encontrada" },
  },
});

builder.addEndpoint("/forum/votes", "post", {
  summary: "Votar por una pregunta o respuesta",
  description: "Emite un voto positivo o negativo sobre una pregunta o respuesta.",
  tags: ["Academic Q&A"],
  bodySchema: CastVoteBodySchema,
  responses: {
    200: { description: "Voto registrado exitosamente" },
    400: { description: "Error de validación — tipo de voto o destino inválido" },
  },
});

builder.toFile("src/openapi/openapi.partial.json");
