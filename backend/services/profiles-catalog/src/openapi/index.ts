import { z } from "zod";
import { OpenAPIBuilder, dataResponse, dataListResponse, messageResponse } from "../../../../shared/contracts/openapi/index.js";

const UuidSchema = z.string().uuid();

const StudentProfileSchema = z.object({
  id: UuidSchema,
  fullName: z.string(),
  avatarUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  role: z.string().optional(),
  semester: z.number().int().positive().nullable().optional(),
  programId: UuidSchema.nullable().optional(),
  programName: z.string().nullable().optional(),
  facultyName: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  carrera: z.any().nullable().optional(),
  asignaturasActivas: z.array(z.any()).optional(),
  indicadores: z.any().nullable().optional(),
  insignias: z.array(z.any()).optional(),
});

const CreateProfileBodySchema = z.object({
  fullName: z.string().min(2).max(200),
});

const UpdateProfileBodySchema = z.object({
  full_name: z.string().min(2).max(200).optional(),
  bio: z.string().max(500).optional(),
  phone_number: z.string().max(20).optional(),
  avatar_url: z.string().optional(),
  semester: z.number().int().positive().optional(),
});

const SetPrimaryProgramBodySchema = z.object({
  program_id: UuidSchema,
});

const AvatarResponseSchema = z.object({
  url: z.string().url(),
});

const AddSubjectBodySchema = z.object({
  subject_id: UuidSchema,
});

const SubjectSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  code: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  credits: z.number().int().nullable().optional(),
  semester: z.number().int().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});

const ProgramSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  code: z.string().nullable().optional(),
  facultyId: UuidSchema.optional(),
  facultyName: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  isPrimary: z.boolean().optional(),
});

const builder = new OpenAPIBuilder({
  title: "UniConnect Profiles Catalog Service",
  version: "0.1.0",
  serverUrl: "http://localhost:3105",
  basePath: "/api/v1",
});

builder.addTag("Profiles Catalog", "Catálogo de perfiles de usuario");

builder.addEndpoint("/students/me", "get", {
  summary: "Obtener perfil propio",
  description: "Retorna el perfil completo del usuario autenticado. Si no existe, lo crea con valores por defecto.",
  tags: ["Profiles Catalog"],
  responses: {
    200: { description: "Perfil obtenido exitosamente", schema: dataResponse(StudentProfileSchema) },
  },
});

builder.addEndpoint("/students/me", "patch", {
  summary: "Actualizar perfil propio",
  description: "Actualiza los campos del perfil del usuario autenticado.",
  tags: ["Profiles Catalog"],
  bodySchema: UpdateProfileBodySchema,
  responses: {
    200: { description: "Perfil actualizado exitosamente", schema: dataResponse(StudentProfileSchema) },
    400: { description: "Error de validación" },
  },
});

builder.addEndpoint("/students/profile", "post", {
  summary: "Crear perfil de estudiante",
  description: "Crea un perfil de estudiante con el nombre completo proporcionado.",
  tags: ["Profiles Catalog"],
  bodySchema: CreateProfileBodySchema,
  responses: {
    201: { description: "Perfil creado exitosamente", schema: dataResponse(StudentProfileSchema) },
    400: { description: "Error de validación" },
  },
});

builder.addEndpoint("/students/me/primary-program", "patch", {
  summary: "Establecer programa principal",
  description: "Define el programa académico principal del usuario autenticado.",
  tags: ["Profiles Catalog"],
  bodySchema: SetPrimaryProgramBodySchema,
  responses: {
    200: { description: "Programa principal actualizado", schema: dataResponse(StudentProfileSchema) },
    400: { description: "Error de validación" },
  },
});

builder.addEndpoint("/students/me/programs", "get", {
  summary: "Obtener programas del usuario",
  description: "Lista los programas académicos en los que el usuario está inscrito.",
  tags: ["Profiles Catalog"],
  responses: {
    200: { description: "Lista de programas obtenida exitosamente", schema: dataListResponse(ProgramSchema) },
  },
});

builder.addEndpoint("/students/me/subjects", "get", {
  summary: "Obtener materias del usuario",
  description: "Lista las materias que el usuario tiene registradas.",
  tags: ["Profiles Catalog"],
  responses: {
    200: { description: "Lista de materias obtenida exitosamente", schema: dataListResponse(SubjectSchema) },
  },
});

builder.addEndpoint("/students/me/subjects", "post", {
  summary: "Agregar materia al usuario",
  description: "Registra una materia en el perfil del usuario autenticado.",
  tags: ["Profiles Catalog"],
  bodySchema: AddSubjectBodySchema,
  responses: {
    201: { description: "Materia agregada exitosamente" },
    400: { description: "Error de validación" },
  },
});

builder.addEndpoint("/students/me/subjects/:subjectId", "delete", {
  summary: "Eliminar materia del usuario",
  description: "Elimina una materia del perfil del usuario autenticado.",
  tags: ["Profiles Catalog"],
  paramsSchema: z.object({ subjectId: UuidSchema }),
  responses: {
    200: { description: "Materia eliminada exitosamente" },
    404: { description: "Materia no encontrada" },
  },
});

builder.addEndpoint("/students/me/avatar", "post", {
  summary: "Subir avatar",
  description: "Sube o actualiza la imagen de avatar del usuario autenticado.",
  tags: ["Profiles Catalog"],
  bodySchema: z.object({
    image: z.string().min(1),
    user_id: UuidSchema.optional(),
  }),
  responses: {
     200: { description: "Avatar actualizado exitosamente", schema: dataResponse(AvatarResponseSchema) },
    400: { description: "Error de validación" },
  },
});

builder.addEndpoint("/students", "get", {
  summary: "Buscar estudiantes",
  description: "Busca estudiantes por materia, texto libre, o lista todos.",
  tags: ["Profiles Catalog"],
  querySchema: z.object({
    search: z.string().max(200).optional(),
    subjectId: z.string().min(1).optional(),
    currentUserId: UuidSchema.optional(),
  }),
  responses: {
    200: { description: "Lista de estudiantes obtenida exitosamente", schema: dataListResponse(StudentProfileSchema) },
  },
});

builder.addEndpoint("/students/:id", "get", {
  summary: "Obtener perfil público de estudiante",
  description: "Retorna la información pública del perfil de un estudiante por su ID.",
  tags: ["Profiles Catalog"],
  paramsSchema: z.object({ id: UuidSchema }),
  querySchema: z.object({
    vista: z.enum(["completa"]).optional(),
    currentUserId: UuidSchema.optional(),
  }),
  responses: {
    200: { description: "Perfil encontrado exitosamente", schema: dataResponse(StudentProfileSchema) },
    404: { description: "Perfil no encontrado" },
  },
});

builder.addEndpoint("/catalog/subjects", "get", {
  summary: "Listar todas las materias",
  description: "Obtiene el catálogo completo de materias disponibles.",
  tags: ["Profiles Catalog"],
  responses: {
    200: { description: "Lista de materias obtenida exitosamente", schema: dataListResponse(SubjectSchema) },
  },
});

builder.addEndpoint("/catalog/programs", "get", {
  summary: "Listar programas académicos",
  description: "Obtiene la lista de programas académicos. Puede filtrarse por facultad.",
  tags: ["Profiles Catalog"],
  querySchema: z.object({
    facultyId: UuidSchema.optional(),
  }),
  responses: {
    200: { description: "Lista de programas obtenida exitosamente", schema: dataListResponse(ProgramSchema) },
  },
});

builder.addEndpoint("/catalog/programs/:programId/subjects", "get", {
  summary: "Listar materias por programa",
  description: "Obtiene las materias asociadas a un programa académico específico.",
  tags: ["Profiles Catalog"],
  paramsSchema: z.object({ programId: UuidSchema }),
  responses: {
    200: { description: "Lista de materias obtenida exitosamente", schema: dataListResponse(SubjectSchema) },
    404: { description: "Programa no encontrado" },
  },
});

builder.addEndpoint("/perfil/:id", "get", {
  summary: "Obtener perfil público (alias legacy)",
  description: "Alias de /students/:id para compatibilidad con enlaces legacy.",
  tags: ["Profiles Catalog"],
  paramsSchema: z.object({ id: UuidSchema }),
  querySchema: z.object({
    vista: z.enum(["completa"]).optional(),
    currentUserId: UuidSchema.optional(),
  }),
  responses: {
    200: { description: "Perfil encontrado exitosamente", schema: dataResponse(StudentProfileSchema) },
    404: { description: "Perfil no encontrado" },
  },
});

builder.toFile("src/openapi/openapi.partial.json");
