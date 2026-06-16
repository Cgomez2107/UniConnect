import { IncomingMessage, ServerResponse } from "node:http";
import { SignUpUseCase } from "../../application/use-cases/SignUpUseCase.js";
import { VerifyEmailUseCase } from "../../application/use-cases/VerifyEmailUseCase.js";
import { mapErrorToHttpStatus } from "../../../../../shared/libs/errors/index.js";
import { sendData, sendError } from "../../../../../shared/http/sendJson.js";
import { RegisterRequestSchema, LoginRequestSchema, RefreshTokenRequestSchema } from "@uniconnect/shared-types/contracts/auth";
import type { LoginRequest, RegisterRequest, RefreshTokenRequest } from "@uniconnect/shared-types/contracts/auth";
import { validateBody } from "../../middleware/validationMiddleware.js";

export class AuthController {
  constructor(
    private signUpUseCase: SignUpUseCase,
    private signInUseCase: any,
    private refreshTokenUseCase: any,
    private verifyEmailUseCase?: VerifyEmailUseCase,
  ) {}

  async signup(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const parsed = validateBody<RegisterRequest["body"]>(RegisterRequestSchema.shape.body, body, res);
          if (!parsed) {
            return;
          }

          const result = await this.signUpUseCase.execute(parsed);
          sendData(res, 201, result);
        } catch (error) {
          const mapped = mapErrorToHttpStatus(error);
          sendError(res, mapped.statusCode, mapped.message);
        }
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async signin(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const parsed = validateBody<LoginRequest["body"]>(LoginRequestSchema.shape.body, body, res);
          if (!parsed) {
            return;
          }

          const result = await this.signInUseCase.execute(parsed);

          if (result.accessToken) {
            res.setHeader("Set-Cookie", [
              `auth_token=${result.accessToken}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`,
              `refresh_token=${result.refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`
            ]);
          }

          sendData(res, 200, result);
        } catch (error) {
          const mapped = mapErrorToHttpStatus(error);
          sendError(res, mapped.statusCode, mapped.message);
        }
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async refreshToken(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const parsed = validateBody<RefreshTokenRequest["body"]>(RefreshTokenRequestSchema.shape.body, body, res);
          if (!parsed) {
            return;
          }

          const result = await this.refreshTokenUseCase.execute(parsed);
          sendData(res, 200, result);
        } catch (error) {
          const mapped = mapErrorToHttpStatus(error);
          sendError(res, mapped.statusCode, mapped.message);
        }
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }

  async verifyEmail(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!this.verifyEmailUseCase) {
      sendError(res, 500, "Email verification is not configured");
      return;
    }

    try {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const parsed = JSON.parse(body) as { token?: string };
          if (!parsed.token) {
            sendError(res, 400, "Verification token is required");
            return;
          }

          const result = await this.verifyEmailUseCase!.execute(parsed.token);
          sendData(res, 200, result);
        } catch (error) {
          const mapped = mapErrorToHttpStatus(error);
          sendError(res, mapped.statusCode, mapped.message);
        }
      });
    } catch (error) {
      const mapped = mapErrorToHttpStatus(error);
      sendError(res, mapped.statusCode, mapped.message);
    }
  }
}
