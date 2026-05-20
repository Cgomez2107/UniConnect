import type { IncomingMessage } from "node:http";
import { ApplicationError } from "../../../../../../shared/libs/errors/ApplicationError.js";

const MAX_BODY_BYTES = 50 * 1024 * 1024;

class PayloadTooLargeError extends ApplicationError {
  readonly statusCode = 413;

  constructor() {
    super("Payload demasiado grande. Maximo 50MB.", "PayloadTooLargeError");
    Object.setPrototypeOf(this, PayloadTooLargeError.prototype);
  }
}

export async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8").trim();

  if (!rawBody) {
    return {} as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error("JSON body invalido.");
  }
}
