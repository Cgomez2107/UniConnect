import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createEventsServer } from "../../src/app/createEventsServer.js";
import { EventsController } from "../../src/interfaces/http/controllers/EventsController.js";
import type { VerificationResult } from "../../src/application/use-cases/VerifyQrPass.js";

vi.mock("../../src/interfaces/http/middlewares/isAdminUser.js", () => ({
  isAdminUser: vi.fn(),
}));

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const QR_CONTENT = "uniconnect://access?rid=token-123&sig=abc123def456";

type UseCaseStub = { execute: ReturnType<typeof vi.fn> };

function buildEventsServer(stubs?: {
  generateQrPass?: UseCaseStub;
  verifyQrPass?: UseCaseStub;
}) {
  const mockPool = { query: vi.fn() } as never;

  const generateQrPass: UseCaseStub = stubs?.generateQrPass ?? {
    execute: vi.fn().mockResolvedValue({ qrContent: QR_CONTENT }),
  };

  const verifyQrPass: UseCaseStub = stubs?.verifyQrPass ?? {
    execute: vi.fn().mockResolvedValue({
      valid: true,
      user: { fullName: "Carlos Pérez", avatarUrl: null },
      scannedAt: null,
    } satisfies VerificationResult),
  };

  const controller = new EventsController(
    mockPool,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    generateQrPass as never,
    verifyQrPass as never,
  );

  return {
    server: createEventsServer(controller),
    generateQrPass,
    verifyQrPass,
  };
}

describe("US-EV07 — QR: GET /api/v1/events/:id/my-pass (Criterio 1)", () => {
  it("retorna 200 con qrContent cuando el usuario está autenticado", async () => {
    const { server, generateQrPass } = buildEventsServer();

    const res = await request(server as any)
      .get(`/api/v1/events/${UUID}/my-pass`)
      .set("x-user-id", USER_ID)
      .expect(200);

    expect(res.body.data).toHaveProperty("qrContent");
    expect(typeof res.body.data.qrContent).toBe("string");
    expect(res.body.data.qrContent).toContain("uniconnect://access");
    expect(generateQrPass.execute).toHaveBeenCalledWith(UUID, USER_ID);
  });

  it("retorna 401 si no hay x-user-id", async () => {
    const { server } = buildEventsServer();

    await request(server as any)
      .get(`/api/v1/events/${UUID}/my-pass`)
      .expect(401);
  });

  it("el qrContent contiene rid y sig (formato HMAC)", async () => {
    const qrWithHMAC = "uniconnect://access?rid=abc-123&sig=e4b5c6d7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5";
    const { server } = buildEventsServer({
      generateQrPass: {
        execute: vi.fn().mockResolvedValue({ qrContent: qrWithHMAC }),
      },
    });

    const res = await request(server as any)
      .get(`/api/v1/events/${UUID}/my-pass`)
      .set("x-user-id", USER_ID)
      .expect(200);

    expect(res.body.data.qrContent).toMatch(/^uniconnect:\/\/access\?rid=.+&sig=.+$/);
    expect(res.body.data.qrContent).toBe(qrWithHMAC);
  });
});

describe("US-EV07 — QR: POST /api/v1/registration/verify (Criterios 2, 3, 4)", () => {
  it("Criterio 2: retorna valid=true con datos del usuario para QR válido", async () => {
    const { server, verifyQrPass } = buildEventsServer();

    const res = await request(server as any)
      .post("/api/v1/registration/verify")
      .set("x-user-id", USER_ID)
      .set("Content-Type", "application/json")
      .send({ qrData: QR_CONTENT })
      .expect(200);

    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.fullName).toBe("Carlos Pérez");
    expect(verifyQrPass.execute).toHaveBeenCalledWith(QR_CONTENT, USER_ID);
  });

  it("Criterio 2: la respuesta incluye nombre y avatar del usuario", async () => {
    const { server } = buildEventsServer({
      verifyQrPass: {
        execute: vi.fn().mockResolvedValue({
          valid: true,
          user: { fullName: "Ana López", avatarUrl: "https://example.com/avatar.jpg" },
          scannedAt: null,
        } satisfies VerificationResult),
      },
    });

    const res = await request(server as any)
      .post("/api/v1/registration/verify")
      .set("x-user-id", USER_ID)
      .set("Content-Type", "application/json")
      .send({ qrData: QR_CONTENT })
      .expect(200);

    expect(res.body.data.user.fullName).toBe("Ana López");
    expect(res.body.data.user.avatarUrl).toBe("https://example.com/avatar.jpg");
  });

  it("Criterio 3: retorna valid=false con 'Ya verificado' y scannedAt para QR reutilizado", async () => {
    const { server } = buildEventsServer({
      verifyQrPass: {
        execute: vi.fn().mockResolvedValue({
          valid: false,
          reason: "Ya verificado",
          scannedAt: "2026-06-10T14:30:00.000Z",
        } satisfies VerificationResult),
      },
    });

    const res = await request(server as any)
      .post("/api/v1/registration/verify")
      .set("x-user-id", USER_ID)
      .set("Content-Type", "application/json")
      .send({ qrData: QR_CONTENT })
      .expect(200);

    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.reason).toBe("Ya verificado");
    expect(res.body.data.scannedAt).toBe("2026-06-10T14:30:00.000Z");
  });

  it("Criterio 4: retorna valid=false con 'Evento cancelado' para evento cancelado", async () => {
    const { server } = buildEventsServer({
      verifyQrPass: {
        execute: vi.fn().mockResolvedValue({
          valid: false,
          reason: "Evento cancelado",
        } satisfies VerificationResult),
      },
    });

    const res = await request(server as any)
      .post("/api/v1/registration/verify")
      .set("x-user-id", USER_ID)
      .set("Content-Type", "application/json")
      .send({ qrData: QR_CONTENT })
      .expect(200);

    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.reason).toBe("Evento cancelado");
  });

  it("Criterio 4: retorna valid=false con 'Firma digital corrupta' para QR adulterado", async () => {
    const { server } = buildEventsServer({
      verifyQrPass: {
        execute: vi.fn().mockResolvedValue({
          valid: false,
          reason: "Firma digital corrupta",
        } satisfies VerificationResult),
      },
    });

    const res = await request(server as any)
      .post("/api/v1/registration/verify")
      .set("x-user-id", USER_ID)
      .set("Content-Type", "application/json")
      .send({ qrData: "uniconnect://access?rid=x&sig=y" })
      .expect(200);

    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.reason).toBe("Firma digital corrupta");
  });

  it("retorna 400 si qrData no está presente", async () => {
    const { server } = buildEventsServer();

    const res = await request(server as any)
      .post("/api/v1/registration/verify")
      .set("x-user-id", USER_ID)
      .set("Content-Type", "application/json")
      .send({})
      .expect(400);

    expect(res.body.error).toBe("qrData es requerido");
  });

  it("retorna 401 si no hay x-user-id", async () => {
    const { server } = buildEventsServer();

    await request(server as any)
      .post("/api/v1/registration/verify")
      .set("Content-Type", "application/json")
      .send({ qrData: QR_CONTENT })
      .expect(401);
  });

  it("Criterio 3: segundo escaneo del mismo QR rechazado (integración)", async () => {
    let callCount = 0;
    const { server } = buildEventsServer({
      verifyQrPass: {
        execute: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            return { valid: true, user: { fullName: "Carlos", avatarUrl: null }, scannedAt: null } satisfies VerificationResult;
          }
          return { valid: false, reason: "Ya verificado", scannedAt: "2026-06-10T14:30:00.000Z" } satisfies VerificationResult;
        }),
      },
    });

    // Primer escaneo
    const res1 = await request(server as any)
      .post("/api/v1/registration/verify")
      .set("x-user-id", USER_ID)
      .set("Content-Type", "application/json")
      .send({ qrData: QR_CONTENT })
      .expect(200);

    expect(res1.body.data.valid).toBe(true);

    // Segundo escaneo (reutilización)
    const res2 = await request(server as any)
      .post("/api/v1/registration/verify")
      .set("x-user-id", USER_ID)
      .set("Content-Type", "application/json")
      .send({ qrData: QR_CONTENT })
      .expect(200);

    expect(res2.body.data.valid).toBe(false);
    expect(res2.body.data.reason).toBe("Ya verificado");
  });
});
