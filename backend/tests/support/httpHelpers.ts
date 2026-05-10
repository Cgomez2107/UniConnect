import { IncomingMessage, ServerResponse } from "node:http";

export function createMockReqRes(url: string, method = "GET") {
  const req = {
    url,
    method,
    headers: {},
  } as unknown as IncomingMessage;

  let statusCode = 200;
  let headers: Record<string, string> = {};
  let body = "";

  const res = {
    writeHead(code: number, hdrs: Record<string, string>) {
      statusCode = code;
      headers = hdrs;
    },
    end(payload?: string) {
      if (payload) body += payload;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    get headers() {
      return headers;
    },
  } as unknown as ServerResponse;

  return {
    req,
    res,
    getBody: () => body,
  };
}

export default createMockReqRes;
