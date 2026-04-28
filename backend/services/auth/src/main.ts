import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { PostgreSQLAuthRepository } from "./infrastructure/repositories/PostgreSQLAuthRepository.js";
import { PostgreSQLTokenRepository } from "./infrastructure/repositories/PostgreSQLTokenRepository.js";
import { JWTService } from "./infrastructure/jwt/JWTService.js";
import { SignUpUseCase } from "./application/use-cases/SignUpUseCase.js";
import { SignInUseCase } from "./application/use-cases/SignInUseCase.js";
import { RefreshTokenUseCase } from "./application/use-cases/RefreshTokenUseCase.js";
import { AuthController } from "./interfaces/http/AuthController.js";
import { requireEnv } from "../../../shared/libs/config/requiredEnv.js";

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(".env");
  }
} catch {
  // Ignore missing .env on environments where vars are injected externally.
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
 * Genera la URL de autorización de Google con redirectTo dinámico
 */
function sendOAuthUrl(res: ServerResponse, redirectTo?: string): void {
  const supabaseUrl = process.env.SUPABASE_URL || "https://becitrklvpadvjwdbmck.supabase.co";
  const hd = "ucaldas.edu.co"; // restricción de dominio institucional
  
  // Construir URL base de Supabase
  let authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&hd=${hd}`;
  
  // Si se proporciona redirectTo, agregarlo como parámetro
  if (redirectTo) {
    authUrl += `&redirect_to=${encodeURIComponent(redirectTo)}`;
  }
  
  res.writeHead(200);
  res.end(JSON.stringify({ url: authUrl }));
}

async function main() {
  // Inyección de dependencias
  const authRepository = new PostgreSQLAuthRepository();
  const tokenRepository = new PostgreSQLTokenRepository();
  const jwtService = new JWTService();

  const signUpUseCase = new SignUpUseCase(authRepository, tokenRepository, jwtService);
  const signInUseCase = new SignInUseCase(authRepository, tokenRepository, jwtService);
  const refreshTokenUseCase = new RefreshTokenUseCase(tokenRepository, authRepository, jwtService);

  const authController = new AuthController(signUpUseCase, signInUseCase, refreshTokenUseCase);

  // Crear servidor
  const server = createServer(async (req, res) => {
    const path = req.url?.split("?")[0] || "";
    const method = req.method || "GET";

    // Headers CORS
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (method === "OPTIONS") {
      res.writeHead(200);
      res.end();
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
      // Endpoint para recuperar sesión basada en cookies (Criterio 2)
      // En una implementación real, esto validaría el token de la cookie
      // y devolvería la sesión. Por ahora, si llegamos aquí es porque el Gateway
      // ya validó el token (o no).
      const auth = req.headers.authorization;
      if (auth?.startsWith("Bearer ")) {
        // En un caso real buscaríamos el usuario en la DB
        // Aquí devolvemos un mock basado en que el Gateway pasó el token
        res.writeHead(200);
        res.end(JSON.stringify({ 
          session: { user: { email: "usuario@ucaldas.edu.co" }, access_token: auth.substring(7) } 
        }));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({ error: "No session found" }));
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
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  (server as any).listen({ port: PORT, host: "0.0.0.0" }, () => {
    console.log(
      JSON.stringify({
        service: "auth",
        level: "info",
        message: "Service listening",
        port: PORT,
        host: "0.0.0.0",
        nodeEnv,
      }),
    );
  });
}

main().catch(console.error);
