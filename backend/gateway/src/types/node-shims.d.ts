declare module "node:http" {
  export interface IncomingMessage {
    method?: string;
    url?: string;
    headers: Record<string, string | string[] | undefined>;
    [Symbol.asyncIterator](): AsyncIterableIterator<string | Uint8Array>;
  }

  export interface ServerResponse {
    setHeader(name: string, value: string): this;
    writeHead(statusCode: number, headers?: Record<string, string>): this;
    end(data?: string): void;
  }

  export function createServer(
    handler: (req: IncomingMessage, res: ServerResponse) => void,
  ): {
    listen(port: number, callback?: () => void): void;
  };
}
