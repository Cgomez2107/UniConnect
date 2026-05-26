import { z } from "zod";
import { OpenAPIBuilder, dataResponse, dataListResponse, messageResponse } from "../../../../shared/contracts/openapi/index.js";
import { AuthProfileSchema } from "@uniconnect/shared-types";

const UuidSchema = z.string().uuid();
const EmailSchema = z.string().email();

const LoginBodySchema = z.object({
  email: EmailSchema,
  password: z.string().min(6),
});

const LoginResponseSchema = z.object({
  user: AuthProfileSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().positive(),
});

const RegisterBodySchema = z.object({
  email: EmailSchema,
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(200),
});

const RegisterResponseSchema = z.object({
  user: z.object({
    id: UuidSchema,
    email: EmailSchema,
    fullName: z.string(),
    role: z.enum(["estudiante", "admin"]),
  }),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().positive(),
});

const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

const RefreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().positive(),
});

const SessionResponseSchema = z.object({
  session: z.object({
    user: z.object({
      id: UuidSchema,
      email: EmailSchema,
      fullName: z.string(),
      role: z.enum(["estudiante", "admin"]),
    }),
    accessToken: z.string().min(1),
  }),
});

const MeResponseSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  fullName: z.string(),
  role: z.enum(["estudiante", "admin"]),
});

const OAuthUrlResponseSchema = z.object({
  url: z.string().url(),
});

const OAuthCallbackBodySchema = z.object({
  accessToken: z.string().min(1),
  email: EmailSchema,
});

const OAuthCallbackResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: AuthProfileSchema,
});

const builder = new OpenAPIBuilder({
  title: "UniConnect Auth Service",
  version: "0.1.0",
  serverUrl: "http://localhost:3102",
  basePath: "/api/v1",
});

builder.addTag("Auth", "Autenticación y gestión de sesiones");

builder.addEndpoint("/auth/signin", "post", {
  summary: "Iniciar sesión con credenciales",
  description: "Autentica al usuario con email y contraseña. Retorna un token JWT de acceso, refresh token y los datos del perfil.",
  tags: ["Auth"],
  bodySchema: LoginBodySchema,
  responses: {
    200: { description: "Inicio de sesión exitoso", schema: dataResponse(LoginResponseSchema) },
    401: { description: "Credenciales inválidas — email o contraseña incorrectos" },
  },
});

builder.addEndpoint("/auth/signup", "post", {
  summary: "Registrar un nuevo usuario",
  description: "Crea una cuenta de usuario con email corporativo @ucaldas.edu.co, contraseña y nombre completo.",
  tags: ["Auth"],
  bodySchema: RegisterBodySchema,
  responses: {
    201: { description: "Usuario registrado exitosamente", schema: dataResponse(RegisterResponseSchema) },
    400: { description: "Error de validación — datos de entrada inválidos" },
    409: { description: "El email ya está registrado" },
  },
});

builder.addEndpoint("/auth/refresh", "post", {
  summary: "Renovar token de acceso",
  description: "Intercambia un refresh token válido por un nuevo par de tokens.",
  tags: ["Auth"],
  bodySchema: RefreshBodySchema,
  responses: {
    200: { description: "Tokens renovados exitosamente", schema: dataResponse(RefreshResponseSchema) },
    401: { description: "Refresh token inválido o expirado" },
  },
});

builder.addEndpoint("/auth/session", "get", {
  summary: "Obtener sesión actual",
  description: "Retorna la información de la sesión actual del usuario autenticado.",
  tags: ["Auth"],
  responses: {
    200: { description: "Sesión obtenida exitosamente", schema: dataResponse(SessionResponseSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/auth/me", "get", {
  summary: "Obtener perfil del usuario autenticado",
  description: "Retorna los datos básicos del perfil del usuario autenticado.",
  tags: ["Auth"],
  responses: {
    200: { description: "Perfil obtenido exitosamente", schema: dataResponse(MeResponseSchema) },
    401: { description: "Token de autenticación requerido o inválido" },
  },
});

builder.addEndpoint("/auth/google", "get", {
  summary: "Obtener URL de autenticación Google OAuth (GET)",
  description: "Genera la URL de redirección para iniciar el flujo de autenticación con Google. Acepta redirectTo como query param.",
  tags: ["Auth"],
  querySchema: z.object({
    redirectTo: z.string().optional(),
  }),
  responses: {
    200: { description: "URL de OAuth generada exitosamente", schema: dataResponse(OAuthUrlResponseSchema) },
  },
});

builder.addEndpoint("/auth/google", "post", {
  summary: "Obtener URL de autenticación Google OAuth (POST)",
  description: "Genera la URL de redirección para iniciar el flujo de autenticación con Google. Acepta redirectTo en el body.",
  tags: ["Auth"],
  bodySchema: z.object({
    redirectTo: z.string().optional(),
  }),
  responses: {
    200: { description: "URL de OAuth generada exitosamente", schema: dataResponse(OAuthUrlResponseSchema) },
  },
});

builder.addEndpoint("/auth/oauth/callback", "post", {
  summary: "Procesar callback de OAuth",
  description: "Intercambia un token de acceso de Supabase (obtenido del flujo OAuth) por un par de tokens JWT del backend.",
  tags: ["Auth"],
  bodySchema: OAuthCallbackBodySchema,
  responses: {
    200: { description: "Autenticación OAuth completada exitosamente", schema: dataResponse(OAuthCallbackResponseSchema) },
    400: { description: "Error de validación — accessToken o email faltantes" },
  },
});

builder.toFile("src/openapi/openapi.partial.json");