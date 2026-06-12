import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import bcryptjs from "bcryptjs";
import { PostgreSQLAuthRepository } from "./infrastructure/repositories/PostgreSQLAuthRepository.js";
import { PostgreSQLTokenRepository } from "./infrastructure/repositories/PostgreSQLTokenRepository.js";
import { JWTService } from "./infrastructure/jwt/JWTService.js";
import { SignUpUseCase } from "./application/use-cases/SignUpUseCase.js";
import { SignInUseCase } from "./application/use-cases/SignInUseCase.js";
import { RefreshTokenUseCase } from "./application/use-cases/RefreshTokenUseCase.js";
import { AuthController } from "./interfaces/http/AuthController.js";
import { requireEnv } from "../../../shared/libs/config/requiredEnv.js";
import { sendData, sendError } from "../../../shared/http/sendJson.js";

function loadEnvFileFallback(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(".env");
  } else {
    loadEnvFileFallback();
  }
} catch {
  loadEnvFileFallback();
}

const portRaw = process.env.PORT ?? process.env.AUTH_SERVICE_PORT;
if (!portRaw) {
  throw new Error("PORT or AUTH_SERVICE_PORT is required");
}
const PORT = Number(portRaw);

const nodeEnv = requireEnv(process.env, "NODE_ENV");

if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error(`Invalid auth service PORT value: ${portRaw}`);
}

/**
 * Genera la URL de autorización de Google con redirectTo dinámico.
 * En desarrollo, mapea URLs de Fly.dev a localhost para evitar redirecciones a producción.
 */
function sendOAuthUrl(
  res: ServerResponse,
  redirectTo?: string,
  prompt = "select_account",
): void {
  const supabaseUrl = process.env.SUPABASE_URL || "https://becitrklvpadvjwdbmck.supabase.co";
  const hd = "ucaldas.edu.co"; // restricción de dominio institucional

  // En desarrollo, mapear URLs de Fly.dev a localhost
  let finalRedirectTo = redirectTo;
  if (nodeEnv === "development" && finalRedirectTo) {
    // Reemplazar cualquier dominio fly.dev con localhost:8080
    finalRedirectTo = finalRedirectTo.replace(/https:\/\/[^/]+\.fly\.dev/g, "http://localhost:8080");
  }

  // Construir URL base de Supabase
  let authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&hd=${hd}&prompt=${encodeURIComponent(prompt)}`;

  // Si se proporciona redirectTo, agregarlo como parámetro
  if (finalRedirectTo) {
    authUrl += `&redirect_to=${encodeURIComponent(finalRedirectTo)}`;
  }

  res.writeHead(200);
  res.end(JSON.stringify({ url: authUrl }));
}

/**
 * Decodifica el payload de un JWT de Supabase sin verificar la firma.
 * El token de acceso de Supabase es un JWT estándar: header.payload.signature.
 * El payload contiene el `sub` (ID del usuario en auth.users) y `email`.
 */
function decodeSupabaseToken(token: string): { sub: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    if (!payload.sub) return null;
    return { sub: payload.sub, email: payload.email ?? "" };
  } catch {
    return null;
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Inyección de dependencias
  const authRepository = new PostgreSQLAuthRepository(databaseUrl);
  const tokenRepository = new PostgreSQLTokenRepository(databaseUrl);
  const jwtService = new JWTService();

  const profilesCatalogBaseUrl = process.env.PROFILES_CATALOG_BASE_URL ?? "http://localhost:3105";
  const supabaseUrl = process.env.SUPABASE_URL ?? "https://becitrklvpadvjwdbmck.supabase.co";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const dispatchWelcomeWebhook = (email: string, fullName: string, userId: string): void => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn(JSON.stringify({ service: "auth", level: "warn", message: "N8N_WEBHOOK_URL is not set. Webhook dispatch skipped." }));
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "usuario.verificado",
        timestamp: new Date().toISOString(),
        data: {
          userId,
          email,
          fullName: fullName || email.split("@")[0],
        },
      }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          console.error(JSON.stringify({ service: "auth", level: "error", message: `Failed to dispatch welcome webhook: ${res.statusText}` }));
        } else {
          console.log(JSON.stringify({ service: "auth", level: "info", message: `Welcome webhook successfully dispatched for ${email}` }));
        }
      })
      .catch((err) => {
        console.error(JSON.stringify({ service: "auth", level: "error", message: "Welcome webhook dispatch failed", error: String(err) }));
      })
      .finally(() => {
        clearTimeout(timeout);
      });
  };

  const createProfile = async (userId: string, fullName: string, email?: string): Promise<void> => {
    const token = jwtService.generateTokens(userId).accessToken;
    const response = await fetch(`${profilesCatalogBaseUrl}/api/v1/students/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fullName }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`Failed to create profile: ${err.error}`);
    }

    if (email) {
      dispatchWelcomeWebhook(email, fullName, userId);
    }
  };

  const signUpUseCase = new SignUpUseCase(
    authRepository,
    tokenRepository,
    jwtService,
    createProfile,
    supabaseUrl,
    supabaseServiceRoleKey,
  );
  const signInUseCase = new SignInUseCase(authRepository, tokenRepository, jwtService, supabaseUrl, supabaseServiceRoleKey);
  const refreshTokenUseCase = new RefreshTokenUseCase(tokenRepository, authRepository, jwtService);

  const authController = new AuthController(signUpUseCase, signInUseCase, refreshTokenUseCase);

  // Crear servidor
  const server = createServer(async (req, res) => {
    const path = req.url?.split("?")[0] || "";
    const method = req.method || "GET";
    const origin = req.headers.origin;

    // Headers CORS - Permitir solo orígenes específicos con credenciales
    const allowedOrigins = [
      "http://localhost:8081",
      "http://localhost:8082",
      "http://127.0.0.1:8081",
      "http://127.0.0.1:8082",
      "http://192.168.140.38:8081",
      "http://192.168.140.38:8082",
      "https://uniconnect-dashboard-web.fly.dev",
    ];
    const devOriginPattern = /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}:(8081|8082)$/;

    const isAllowed =
      (origin != null && allowedOrigins.includes(origin)) ||
      (process.env.NODE_ENV !== "production" && origin != null && devOriginPattern.test(origin));

    if (origin && isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, bypass-tunnel-reminder, ngrok-skip-browser-warning",
    );

    if (method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (method === "GET" && path === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", service: "auth" }));
      return;
    }

    // Rutas
    if (method === "POST" && path === "/signup") {
      await authController.signup(req, res);
    } else if (method === "POST" && path === "/signin") {
      await authController.signin(req, res);
    } else if (method === "POST" && path === "/refresh") {
      await authController.refreshToken(req, res);
    } else if (method === "GET" && path === "/session") {
      const auth = req.headers.authorization;
      if (auth?.startsWith("Bearer ")) {
        try {
          const token = auth.substring(7);
          const payload = jwtService.verifyAccessToken(token);
          if (payload) {
            const user = await authRepository.findById(payload.sub);
            if (user) {
              sendData(res, 200, {
                session: {
                  user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                  },
                  accessToken: token,
                },
              });
            } else {
              sendError(res, 404, "User not found");
            }
          } else {
            sendError(res, 401, "Invalid or expired token");
          }
        } catch {
          sendError(res, 500, "Internal server error");
        }
      } else {
        sendError(res, 401, "No session found");
      }
    } else if (method === "GET" && path === "/me") {
      const auth = req.headers.authorization;
      if (auth?.startsWith("Bearer ")) {
        try {
          const token = auth.substring(7);
          const payload = jwtService.verifyAccessToken(token);
          if (payload) {
            let user = await authRepository.findById(payload.sub);
            if (!user && supabaseServiceRoleKey) {
              // Fallback: buscar en profiles table (usuarios creados via Supabase Auth)
              try {
                const profileResp = await fetch(
                  `${supabaseUrl}/rest/v1/profiles?id=eq.${payload.sub}&select=id,full_name,role,email`,
                  {
                    headers: {
                      apikey: supabaseServiceRoleKey,
                      Authorization: `Bearer ${supabaseServiceRoleKey}`,
                    },
                  },
                );
                if (profileResp.ok) {
                  const rows = await profileResp.json() as Array<{ id: string; full_name: string; role: string; email: string }>;
                  const profile = rows?.[0];
                  if (profile) {
                    sendData(res, 200, {
                      id: profile.id,
                      email: profile.email ?? "",
                      fullName: profile.full_name,
                      role: profile.role,
                    });
                    return;
                  }
                }
              } catch {
                // ignore
              }
            }
            if (user) {
              sendData(res, 200, {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
              });
            } else {
              sendError(res, 404, "User not found");
            }
          } else {
            sendError(res, 401, "Invalid or expired token");
          }
        } catch {
          sendError(res, 500, "Internal server error");
        }
      } else {
        sendError(res, 401, "Authorization header required");
      }
    } else if ((method === "POST" || method === "GET") && path === "/google") {
      // Endpoint unificado para Google OAuth
      // Acepta POST con redirectTo en el body o GET con redirectTo como query param
      let redirectTo: string | undefined;

      if (method === "POST") {
        // Leer body para obtener redirectTo
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            redirectTo = parsed.redirectTo;
            sendOAuthUrl(res, redirectTo);
          } catch (error) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Invalid JSON body" }));
          }
        });
      } else {
        // GET: leer query parameter
        const urlObj = new URL(req.url || "", "http://localhost");
        redirectTo = urlObj.searchParams.get("redirectTo") || undefined;
        sendOAuthUrl(res, redirectTo);
      }
    } else if (method === "POST" && path === "/oauth/callback") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        try {
          const { accessToken } = JSON.parse(body);

          if (!accessToken) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Missing accessToken" }));
            return;
          }

          const decoded = decodeSupabaseToken(accessToken);
          let supabaseUserId: string | undefined = decoded?.sub;
          let email = decoded?.email || "";

          if (!supabaseUserId) {
            try {
              const supabaseUserResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (supabaseUserResponse.ok) {
                const supabaseUser = await supabaseUserResponse.json() as { id: string; email?: string };
                supabaseUserId = supabaseUser.id;
                email = supabaseUser.email || email;
              }
            } catch {
              console.warn("Supabase user fetch fallback also failed");
            }
          }

          if (!supabaseUserId) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Could not resolve Supabase user ID from token" }));
            return;
          }

          if (!email.endsWith("@ucaldas.edu.co")) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "El correo electrónico debe pertenecer al dominio institucional (@ucaldas.edu.co)" }));
            return;
          }

          let user = await authRepository.findByEmail(email);
          let isNewUser = false;
          if (!user) {
            isNewUser = true;
            user = await authRepository.create({
              id: supabaseUserId,
              email,
              fullName: "",
              passwordHash: "",
              role: "estudiante" as const,
              isActive: true,
            });
          }

          const { accessToken: jwtToken, refreshToken } = jwtService.generateTokens(user.id);

          if (isNewUser) {
            let profileCreated = false;
            try {
              await createProfile(user.id, user.fullName || email.split("@")[0], email);
              profileCreated = true;
            } catch (profileErr) {
              console.error("OAuth profile creation error:", profileErr);
            }
            if (!profileCreated) {
              dispatchWelcomeWebhook(email, user.fullName || email.split("@")[0], user.id);
            }
          }

          await tokenRepository.create({
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });

          res.writeHead(200);
          res.end(JSON.stringify({
            accessToken: jwtToken,
            refreshToken,
            isNewUser,
            user: {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              role: user.role,
            },
          }));
        } catch (error) {
          console.error("OAuth callback error:", error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Failed to process OAuth callback" }));
        }
      });
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  if (nodeEnv === "development" && !supabaseServiceRoleKey) {
    try {
      const devSeedPasswordHash = await bcryptjs.hash("Test1234", 10);
      const adminPasswordHash = await bcryptjs.hash("Admin1234", 10);
      const devUsers = [
        { id: "a41040fc-fa2b-4b44-a68b-4418a0279623", email: "test@ucaldas.edu.co", fullName: "Estudiante Test" },
        { id: "a0f6e12e-1c9c-4c87-9c23-a129a92aafdf", email: "estudiante.prueba@ucaldas.edu.co", fullName: "Estudiante Prueba" },
        { id: "b0f6e12e-2c9c-4c87-9c23-b129a92aafdf", email: "admin1@ucaldas.edu.co", fullName: "Admin Principal", passwordHashOverride: adminPasswordHash, roleOverride: "admin" as const },
      ];
      for (const u of devUsers) {
        const exists = await authRepository.findByEmail(u.email);
        if (!exists) {
          await authRepository.create({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            passwordHash: u.passwordHashOverride ?? devSeedPasswordHash,
            role: u.roleOverride ?? "estudiante",
            isActive: true,
          });
          console.log(JSON.stringify({ service: "auth", level: "info", message: `Dev seed: user created ${u.email} with fixed id ${u.id}` }));
        }
      }
    } catch (seedError) {
      console.warn(JSON.stringify({ service: "auth", level: "warn", message: "Dev seed skipped (non-fatal)", error: String(seedError) }));
    }
  }

  (server as any).listen({ port: PORT, host: "::" }, () => {
    console.log(
      JSON.stringify({
        service: "auth",
        level: "info",
        message: "Service listening",
        port: PORT,
        host: "::",
        nodeEnv,
      }),
    );
  });

  const cleanup = async () => {
    console.log(JSON.stringify({ service: "auth", level: "info", message: "Shutting down" }));
    await authRepository.close();
    await tokenRepository.close();
    process.exit(0);
  };

  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
}

main().catch(console.error);
