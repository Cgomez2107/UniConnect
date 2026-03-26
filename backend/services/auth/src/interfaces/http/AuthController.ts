import { IncomingMessage, ServerResponse } from "node:http";
import { SignUpUseCase } from "../../application/use-cases/SignUpUseCase.js";
import { SignUpRequest } from "../../application/dtos/index.js";

// Helper functions simples
function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  const contentLength = new TextEncoder().encode(body).byteLength;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": contentLength.toString(),
  });
  res.end(body);
}

function sendError(res: ServerResponse, statusCode: number, message: string): void {
  sendJson(res, statusCode, { error: message });
}

function sendData<T>(res: ServerResponse, statusCode: number, data: T): void {
  sendJson(res, statusCode, { data });
}

export class AuthController {
  constructor(
    private signUpUseCase: SignUpUseCase,
    private signInUseCase: any, // SignInUseCase
    private refreshTokenUseCase: any // RefreshTokenUseCase
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
          const result = await this.signUpUseCase.execute(request);
          sendData(res, 201, result);
        } catch (error: any) {
          if (error.statusCode) {
            sendError(res, error.statusCode, error.message);
          } else {
            sendError(res, 500, "Internal server error");
          }
        }
      });
    } catch (error: any) {
      sendError(res, 500, "Internal server error");
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
          const result = await this.signInUseCase.execute(request);
          sendData(res, 200, result);
        } catch (error: any) {
          if (error.statusCode) {
            sendError(res, error.statusCode, error.message);
          } else {
            sendError(res, 500, "Internal server error");
          }
        }
      });
    } catch (error: any) {
      sendError(res, 500, "Internal server error");
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
          const result = await this.refreshTokenUseCase.execute(request);
          sendData(res, 200, result);
        } catch (error: any) {
          if (error.statusCode) {
            sendError(res, error.statusCode, error.message);
          } else {
            sendError(res, 500, "Internal server error");
          }
        }
      });
    } catch (error: any) {
      sendError(res, 500, "Internal server error");
    }
  }
}
