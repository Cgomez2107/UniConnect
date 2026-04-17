import type { IncomingMessage } from "node:http";

export async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: string[] = [];
  const decoder = new TextDecoder();

  for await (const chunk of req) {
    if (chunk instanceof Uint8Array) {
      chunks.push(decoder.decode(chunk, { stream: true }));
      continue;
    }

    if (typeof chunk === "string") {
      chunks.push(chunk);
    }
  }

  chunks.push(decoder.decode());
  const raw = chunks.join("").trim();

  if (!raw) {
    return {} as T;
  }

  return JSON.parse(raw) as T;
}
