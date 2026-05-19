import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BaseClient } from "../BaseClient.ts";
import type { DomainError } from "@uniconnect/shared-types";

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

void describe("BaseClient", () => {
  void describe("request()", () => {
    void it("retries on DNS error (ENOTFOUND) and succeeds on 2nd attempt", async () => {
      let calls = 0;
      const client = new BaseClient({ maxRetries: 2, delays: [10, 10], retryableErrorPatterns: [/ENOTFOUND/] });

      const result = await client.request(async () => {
        calls++;
        if (calls === 1) throw new Error("getaddrinfo ENOTFOUND supabase");
        return "ok";
      });

      assert.equal(result, "ok");
      assert.equal(calls, 2);
    });

    void it("retries on DNS error (EAI_AGAIN) and succeeds on 3rd attempt", async () => {
      let calls = 0;
      const client = new BaseClient({ maxRetries: 2, delays: [10, 10], retryableErrorPatterns: [/EAI_AGAIN/] });

      const result = await client.request(async () => {
        calls++;
        if (calls <= 2) throw new Error("EAI_AGAIN DNS resolution failed");
        return "ok";
      });

      assert.equal(result, "ok");
      assert.equal(calls, 3);
    });

    void it("does NOT retry on HTTP 400", async () => {
      let calls = 0;
      const client = new BaseClient({ maxRetries: 2, delays: [10, 10], retryableErrorPatterns: [/ENOTFOUND/] });

      const err = await client
        .request(async () => {
          calls++;
          const httpError = new Error("Bad Request");
          (httpError as any).status = 400;
          throw httpError;
        })
        .catch((e: DomainError) => e);

      assert.equal(err.code, "BAD_REQUEST");
      assert.equal(calls, 1);
    });

    void it("retries on HTTP 500, then throws mapped error", async () => {
      let calls = 0;
      const client = new BaseClient({ maxRetries: 2, delays: [10, 10], retryableErrorPatterns: [] });

      const err = await client
        .request(async () => {
          calls++;
          const httpError = new Error("Internal Server Error");
          (httpError as any).status = 500;
          throw httpError;
        })
        .catch((e: DomainError) => e);

      assert.equal(err.code, "INTERNAL_SERVER_ERROR");
      assert.equal(calls, 3);
    });

    void it("retries on HTTP 503, then throws mapped error", async () => {
      let calls = 0;
      const client = new BaseClient({ maxRetries: 2, delays: [10, 10], retryableErrorPatterns: [] });

      const err = await client
        .request(async () => {
          calls++;
          const httpError = new Error("Service Unavailable");
          (httpError as any).status = 503;
          throw httpError;
        })
        .catch((e: DomainError) => e);

      assert.equal(err.code, "SERVICE_UNAVAILABLE");
      assert.equal(calls, 3);
    });

    void it("does NOT retry on HTTP 401", async () => {
      let calls = 0;
      const client = new BaseClient({ maxRetries: 2, delays: [10, 10], retryableErrorPatterns: [] });

      const err = await client
        .request(async () => {
          calls++;
          const httpError = new Error("Unauthorized");
          (httpError as any).status = 401;
          throw httpError;
        })
        .catch((e: DomainError) => e);

      assert.equal(err.code, "UNAUTHORIZED");
      assert.equal(calls, 1);
    });

    void it("throws UNKNOWN_ERROR for non-retryable non-HTTP errors", async () => {
      const client = new BaseClient({ maxRetries: 2, delays: [10, 10], retryableErrorPatterns: [] });

      const err = await client
        .request(async () => {
          throw new Error("Something weird happened");
        })
        .catch((e: DomainError) => e);

      assert.equal(err.code, "UNKNOWN_ERROR");
    });

    void it("respects maxRetries = 0 (no retry)", async () => {
      let calls = 0;
      const client = new BaseClient({ maxRetries: 0, delays: [], retryableErrorPatterns: [/ENOTFOUND/] });

      const err = await client
        .request(async () => {
          calls++;
          throw new Error("getaddrinfo ENOTFOUND");
        })
        .catch((e: DomainError) => e);

      assert.equal(err.code, "SERVICE_UNAVAILABLE");
      assert.equal(calls, 1);
    });

    void it("retries on network error (ECONNREFUSED)", async () => {
      let calls = 0;
      const client = new BaseClient({ maxRetries: 2, delays: [10, 10], retryableErrorPatterns: [/ENOTFOUND/] });

      const result = await client.request(async () => {
        calls++;
        if (calls === 1) throw new Error("ECONNREFUSED connection refused");
        return "connected";
      });

      assert.equal(result, "connected");
      assert.equal(calls, 2);
    });

    void it("maps network errors to NETWORK_ERROR code", async () => {
      const client = new BaseClient({ maxRetries: 0, delays: [], retryableErrorPatterns: [/ENOTFOUND/] });

      const err = await client
        .request(async () => {
          throw new Error("fetch failed: ECONNRESET");
        })
        .catch((e: DomainError) => e);

      assert.equal(err.code, "NETWORK_ERROR");
    });

    void it("DomainError includes timestamp and details", async () => {
      const client = new BaseClient({ maxRetries: 0, delays: [], retryableErrorPatterns: [] });

      const err = await client
        .request(async () => {
          const httpError = new Error("Not Found");
          (httpError as any).status = 404;
          throw httpError;
        })
        .catch((e: DomainError) => e);

      assert.ok(err.timestamp instanceof Date);
      assert.ok(err.details);
      assert.equal(err.details!.status, 404);
    });
  });

  void describe("mapError()", () => {
    void it("maps DNS errors to SERVICE_UNAVAILABLE", () => {
      const client = new BaseClient();
      const err = client.mapError(new Error("getaddrinfo ENOTFOUND supabase.co"));
      assert.equal(err.code, "SERVICE_UNAVAILABLE");
    });

    void it("maps HTTP 403 to FORBIDDEN", () => {
      const client = new BaseClient();
      const httpError = new Error("Forbidden");
      (httpError as any).status = 403;
      const err = client.mapError(httpError);
      assert.equal(err.code, "FORBIDDEN");
    });

    void it("maps HTTP 404 to NOT_FOUND", () => {
      const client = new BaseClient();
      const httpError = new Error("Not Found");
      (httpError as any).status = 404;
      const err = client.mapError(httpError);
      assert.equal(err.code, "NOT_FOUND");
    });

    void it("maps random errors to UNKNOWN_ERROR", () => {
      const client = new BaseClient();
      const err = client.mapError(new Error("random crash"));
      assert.equal(err.code, "UNKNOWN_ERROR");
    });
  });

  void describe("isRetryableHttp()", () => {
    void it("returns true for 500-599", () => {
      const client = new BaseClient();
      assert.equal(client.isRetryableHttp(500), true);
      assert.equal(client.isRetryableHttp(503), true);
      assert.equal(client.isRetryableHttp(599), true);
    });

    void it("returns false for 400-499", () => {
      const client = new BaseClient();
      assert.equal(client.isRetryableHttp(400), false);
      assert.equal(client.isRetryableHttp(401), false);
      assert.equal(client.isRetryableHttp(404), false);
    });

    void it("returns false for undefined", () => {
      const client = new BaseClient();
      assert.equal(client.isRetryableHttp(undefined), false);
    });
  });
});
