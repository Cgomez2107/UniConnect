import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockFetch = jest.fn<typeof fetch>();
globalThis.fetch = mockFetch as unknown as typeof fetch;

import { SupabasePushGateway } from "../src/infrastructure/gateways/SupabasePushGateway.js";

const EDGE_FN_URL = "https://functions.supabase.co/notifications";
const SERVICE_KEY = "test_svc_key_123";

describe("SupabasePushGateway", () => {
  let loggerSpy: { error: jest.Mock; warn: jest.Mock; info: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    loggerSpy = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  });

  it("enviarPush hace POST a la Edge Function con los headers correctos", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

    const gateway = new SupabasePushGateway(EDGE_FN_URL, SERVICE_KEY, loggerSpy);
    await gateway.enviarPush("user-001", "Test Title", "Test Body", { key: "val" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(EDGE_FN_URL);
    expect(options.method).toBe("POST");
    expect(options.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
      "X-Source": "strategy-gateway",
    });
  });

  it("enviarPush envia el payload correcto en el body", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

    const gateway = new SupabasePushGateway(EDGE_FN_URL, SERVICE_KEY, loggerSpy);
    await gateway.enviarPush("user-002", "Push Title", "Push Body", { type: "solicitud_ingreso" });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.type).toBe("INSERT");
    expect(body.table).toBe("strategy_gateway");
    expect(body.record.user_id).toBe("user-002");
    expect(body.record.title).toBe("Push Title");
    expect(body.record.body).toBe("Push Body");
    expect(body.record.data).toEqual({ type: "solicitud_ingreso" });
  });

  it("lanza error si la Edge Function responde con status no-OK", async () => {
    mockFetch.mockResolvedValueOnce(new Response("Rate limit exceeded", { status: 429 }));

    const gateway = new SupabasePushGateway(EDGE_FN_URL, SERVICE_KEY, loggerSpy);
    await expect(
      gateway.enviarPush("user-003", "Fail", "Fail body", {}),
    ).rejects.toThrow("Edge Function responded with 429: Rate limit exceeded");
  });

  it("loggea exito cuando el push se envia correctamente", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

    const gateway = new SupabasePushGateway(EDGE_FN_URL, SERVICE_KEY, loggerSpy);
    await gateway.enviarPush("user-004", "Log Test", "Body", {});

    expect(loggerSpy.info).toHaveBeenCalledWith(expect.stringContaining("push_sent"));
  });

  it("no modifica la URL si ya no tiene trailing slash", () => {
    const gateway = new SupabasePushGateway("https://func.test/endpoint", SERVICE_KEY, loggerSpy);
    expect((gateway as unknown as { edgeFunctionUrl: string }).edgeFunctionUrl).toBe(
      "https://func.test/endpoint",
    );
  });

  it("remueve trailing slash de la URL", () => {
    const gateway = new SupabasePushGateway("https://func.test/endpoint/", SERVICE_KEY, loggerSpy);
    expect((gateway as unknown as { edgeFunctionUrl: string }).edgeFunctionUrl).toBe(
      "https://func.test/endpoint",
    );
  });
});
