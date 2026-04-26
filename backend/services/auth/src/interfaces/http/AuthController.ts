import { IncomingMessage, ServerResponse } from "node:http";
import { SignUpUseCase } from "../../application/use-cases/SignUpUseCase.js";
import { SignUpRequest } from "../../application/dtos/index.js";
import { mapErrorToHttpStatus } from "../../../../../shared/libs/errors/index.js";
import { sendData, sendError, sendJson } from "../../../../../shared/http/sendJson.js";
import { DtoValidationError, Validators, validateDto } from "../../../../../shared/libs/validation/index.js";

export class AuthController {
  constructor(
    private signUpUseCase: SignUpUseCase,
    private signInUseCase: any, // SignInUseCase
    private refreshTokenUseCase: any, // RefreshTokenUseCase
  ) {}

  async signup(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const request = JSON.parse(body) as SignUpRequest;
          validateDto(request, {
            email: [
              (value) => Validators.required(value, "email"),
              (value) => Validators.email(String(value ?? ""), "email"),
              (value) => Validators.institutionalDomain(String(value ?? ""), "email"),
            ],
            password: [
              (value) => Validators.required(value, "password"),
              (value) => Validators.minLength(String(value ?? ""), 8, "password"),
            ],
            fullName: [
              (value) => Validators.required(value, "fullName"),
              (value) => Validators.minLength(String(value ?? ""), 2, "fullName"),
            ],
          });
          const result = await this.signUpUseCase.execute(request);
          sendData(res, 201, result);
        } catch (error) {
          if (error instanceof DtoValidationError) {
            sendJson(res, 400, { error: error.message, fields: error.fields });
            return;
          }

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
          const request = JSON.parse(body);
          validateDto(request, {
            email: [
              (value) => Validators.required(value, "email"),
              (value) => Validators.email(String(value ?? ""), "email"),
              (value) => Validators.institutionalDomain(String(value ?? ""), "email"),
            ],
            password: [(value) => Validators.required(value, "password")],
          });
          const result = await this.signInUseCase.execute(request);
          
          // Establecer cookie httpOnly para persistencia segura en web
          if (result.accessToken) {
            res.setHeader("Set-Cookie", [
              `auth_token=${result.accessToken}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax`,
              `refresh_token=${result.refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`
            ]);
          }

          sendData(res, 200, result);
        } catch (error) {
          if (error instanceof DtoValidationError) {
            sendJson(res, 400, { error: error.message, fields: error.fields });
            return;
          }

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
          const request = JSON.parse(body);
          validateDto(request, {
            refreshToken: [(value) => Validators.required(value, "refreshToken")],
          });
          const result = await this.refreshTokenUseCase.execute(request);
          sendData(res, 200, result);
        } catch (error) {
          if (error instanceof DtoValidationError) {
            sendJson(res, 400, { error: error.message, fields: error.fields });
            return;
          }

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
