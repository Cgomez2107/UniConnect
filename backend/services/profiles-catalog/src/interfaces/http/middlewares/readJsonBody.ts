import type { IncomingMessage } from "node:http";

/**
 * Lee y parsea el body JSON de una request
 */
export async function readJsonBody<T = unknown>(req: IncomingMessage): Promise<T> {
  let body = "";

  return new Promise((resolve, reject) => {
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf-8");
      if (body.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body || "{}");
        resolve(parsed);
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}
