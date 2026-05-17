import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import pg from "pg";
const { Pool } = pg;
import { PostgreSQLAuthRepository } from "./infrastructure/repositories/PostgreSQLAuthRepository.js";
import { PostgreSQLTokenRepository } from "./infrastructure/repositories/PostgreSQLTokenRepository.js";
import { JWTService } from "./infrastructure/jwt/JWTService.js";
import { SignUpUseCase } from "./application/use-cases/SignUpUseCase.js";
import { SignInUseCase } from "./application/use-cases/SignInUseCase.js";
import { RefreshTokenUseCase } from "./application/use-cases/RefreshTokenUseCase.js";
import { AuthController } from "./interfaces/http/AuthController.js";
import { requireEnv } from "../../../shared/libs/config/requiredEnv.js";

const DIRTY_FLAG_MESSAGE =
  "CRITICAL: Database configuration missing. " +
  "This service REQUIRES a PostgreSQL database. " +
  "Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD environment variables.";

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

function sendOAuthUrl(res: ServerResponse, redirectTo?: string): void {
  const supabaseUrl = process.env.SUPABASE_URL || "https://becitrklvpadvjwdbmck.supabase.co";
  const hd = "ucaldas.edu.co";

  let authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&hd=${hd}`;

  if (redirectTo) {
    authUrl += `&redirect_to=${encodeURIComponent(redirectTo)}`;
  }

  res.writeHead(200);
  res.end(JSON.stringify({ url: authUrl }));
}

async function main() {
  const dbHost = requireEnv(process.env, "DB_HOST");
  const dbPortRaw = requireEnv(process.env, "DB_PORT");
  const dbName = requireEnv(process.env, "DB_NAME");
  const dbUser = requireEnv(process.env, "DB_USER");
  const dbPassword = requireEnv(process.env, "DB_PASSWORD");

  const pool = new Pool({
    host: dbHost,
    port: Number(dbPortRaw),
    database: dbName,
    user: dbUser,
    password: dbPassword,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    max: 20,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error(
      JSON.stringify({
        service: "auth",
        level: "error",
        message: "Unexpected error on idle database client",
        error: err.message,
      }),
    );
  });

  const authRepository = new PostgreSQLAuthRepository(pool);
  const tokenRepository = new PostgreSQLTokenRepository(pool);
  const jwtService = new JWTService();

  const signUpUseCase = new SignUpUseCase(authRepository, tokenRepository, jwtService);
  const signInUseCase = new SignInUseCase(authRepository, tokenRepository, jwtService);
  const refreshTokenUseCase = new RefreshTokenUseCase(tokenRepository, authRepository, jwtService);

  const authController = new AuthController(signUpUseCase, signInUseCase, refreshTokenUseCase);

  const server = createServer(async (req, res) => {
    const path = req.url?.split("?")[0] || "";
    const method = req.method || "GET";

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

    if (method === "POST" && path === "/signup") {
      await authController.signup(req, res);
    } else if (method === "POST" && path === "/signin") {
      await authController.signin(req, res);
    } else if (method === "POST" && path === "/refresh") {
      await authController.refreshToken(req, res);
    } else if (method === "GET" && path === "/session") {
      const auth = req.headers.authorization;
      if (auth?.startsWith("Bearer ")) {
        const token = auth.substring(7);
        const payload = jwtService.verifyAccessToken(token);
        if (!payload) {
          res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "Invalid or expired token" }));
          return;
        }
        try {
          const user = await authRepository.findById(payload.sub);
          if (!user) {
            res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ error: "User not found" }));
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({
            session: {
              user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
              },
              access_token: token,
            },
          }));
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      } else {
        res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "No session found" }));
      }
    } else if ((method === "POST" || method === "GET") && path === "/google") {
      let redirectTo: string | undefined;

      if (method === "POST") {
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
        const urlObj = new URL(req.url || "", "http://localhost");
        redirectTo = urlObj.searchParams.get("redirectTo") || undefined;
        sendOAuthUrl(res, redirectTo);
      }
    } else {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

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

  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Iniciando cierre controlado (Graceful Shutdown) del servicio auth...`);

    server.close(() => {
      console.log("[Shutdown] Servidor HTTP cerrado.");
    });

    try {
      await pool.end();
      console.log("[Shutdown] Limpieza de recursos completada con éxito.");
      process.exit(0);
    } catch (error) {
      console.error("[Shutdown] Error durante el cierre de recursos:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      service: "auth",
      level: "fatal",
      message: DIRTY_FLAG_MESSAGE,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
