import { createServer } from "node:http";
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
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(PORT, () => {
    console.log(
      JSON.stringify({
        service: "auth",
        level: "info",
        message: "Service listening",
        port: PORT,
        nodeEnv,
      }),
    );
  });
}

main().catch(console.error);
