import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapStorageError, StorageService, STORAGE_BUCKETS } from "../StorageService.js";

void describe("StorageService", () => {
  void describe("constructor", () => {
    void it("throws when supabaseUrl is empty", () => {
      assert.throws(
        () => new StorageService("", "valid-key"),
        { message: /supabaseUrl y supabaseAnonKey son requeridas/ },
      );
    });

    void it("throws when supabaseAnonKey is empty", () => {
      assert.throws(
        () => new StorageService("https://example.supabase.co", ""),
        { message: /supabaseUrl y supabaseAnonKey son requeridas/ },
      );
    });
  });

  void describe("mapStorageError", () => {
    void it("maps ENOTFOUND DNS error to SERVICE_UNAVAILABLE", () => {
      const result = mapStorageError(new Error("getaddrinfo ENOTFOUND supabase"));
      assert.equal(result.code, "SERVICE_UNAVAILABLE");
      assert.equal(result.severity, "warning");
    });

    void it("maps EAI_AGAIN DNS error to SERVICE_UNAVAILABLE", () => {
      const result = mapStorageError(new Error("EAI_AGAIN temporary failure"));
      assert.equal(result.code, "SERVICE_UNAVAILABLE");
    });

    void it("maps generic fetch/network error to NETWORK_ERROR", () => {
      const result = mapStorageError(new Error("fetch failed: connection refused"));
      assert.equal(result.code, "NETWORK_ERROR");
      assert.equal(result.severity, "warning");
    });

    void it("maps 403 RLS error to FORBIDDEN", () => {
      const result = mapStorageError({ statusCode: 403, message: "row-level security policy violation" });
      assert.equal(result.code, "FORBIDDEN");
      assert.equal(result.severity, "error");
    });

    void it("maps 404 to NOT_FOUND", () => {
      const result = mapStorageError({ statusCode: 404 });
      assert.equal(result.code, "NOT_FOUND");
    });

    void it("maps 500 to INTERNAL_SERVER_ERROR", () => {
      const result = mapStorageError({ statusCode: 500 });
      assert.equal(result.code, "INTERNAL_SERVER_ERROR");
    });

    void it("maps unknown error to UNKNOWN_ERROR", () => {
      const result = mapStorageError({ statusCode: 418, message: "teapot" });
      assert.equal(result.code, "UNKNOWN_ERROR");
    });

    void it("includes original error in details", () => {
      const original = new Error("original message");
      const result = mapStorageError(original);
      assert.equal(result.details.original, "original message");
    });

    void it("has timestamp set", () => {
      const before = Date.now();
      const result = mapStorageError(new Error("test"));
      const after = Date.now();
      assert.ok(result.timestamp instanceof Date);
      assert.ok(result.timestamp.getTime() >= before && result.timestamp.getTime() <= after);
    });
  });

  void describe("STORAGE_BUCKETS", () => {
    void it("AVATARS has correct config", () => {
      const config = STORAGE_BUCKETS.AVATARS;
      assert.equal(config.name, "avatars");
      assert.equal(config.public, true);
      assert.ok(config.allowedMimeTypes.includes("image/jpeg"));
      assert.equal(config.maxFileSizeMb, 5);
    });

    void it("RESOURCES has correct config", () => {
      const config = STORAGE_BUCKETS.RESOURCES;
      assert.equal(config.name, "resources");
      assert.ok(config.allowedMimeTypes.includes("application/pdf"));
      assert.equal(config.maxFileSizeMb, 50);
    });
  });
});
