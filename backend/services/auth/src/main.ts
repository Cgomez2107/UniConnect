import { PostgreSQLAuthRepository } from "./infrastructure/repositories/PostgreSQLAuthRepository.js";
import { PostgreSQLTokenRepository } from "./infrastructure/repositories/PostgreSQLTokenRepository.js";
import { JWTService } from "./infrastructure/jwt/JWTService.js";
import { SignUpUseCase } from "./application/use-cases/SignUpUseCase.js";
import { SignInUseCase } from "./application/use-cases/SignInUseCase.js";
import { RefreshTokenUseCase } from "./application/use-cases/RefreshTokenUseCase.js";
import { AuthController } from "./interfaces/http/AuthController.js";
import { createAuthServer } from "./app/createAuthServer.js";
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
  const server = createAuthServer(authController);

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
}

main().catch(console.error);
