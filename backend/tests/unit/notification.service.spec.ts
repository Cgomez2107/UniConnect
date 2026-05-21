import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../../shared/patterns/strategy/NotificationService.js";
import type { INotificationStrategy, NotificacionDTO } from "../../shared/patterns/strategy/INotificationStrategy.js";
import type { IPreferenceService } from "../../shared/patterns/strategy/IPreferenceService.js";
import type { IEmailGateway } from "../../shared/patterns/strategy/EmailInstitucionalStrategy.js";
import type { IStudyGroupSocketGateway } from "../../shared/patterns/strategy/InAppWebSocketStrategy.js";
import type { IPushGateway } from "../../shared/patterns/strategy/PushMovilStrategy.js";

// ──────────────────────────────────────────────
// Transport Mock Factories
// ──────────────────────────────────────────────

function createMockSMTPClient() {
  const enviarEmail = vi.fn<[string, string, string], Promise<void>>();
  const instance: IEmailGateway = { enviarEmail };
  return { instance, enviarEmail };
}

function createMockWSClient() {
  const emitToUser = vi.fn<[string, string, Record<string, unknown>], Promise<void>>();
  const instance: IStudyGroupSocketGateway = { emitToUser };
  return { instance, emitToUser };
}

function createMockExpoClient() {
  const enviarPush = vi.fn<[string, string, string, Record<string, unknown>], Promise<void>>();
  const instance: IPushGateway = { enviarPush };
  return { instance, enviarPush };
}

// ──────────────────────────────────────────────
// Strategy Factory
// Wraps a transport call into an INotificationStrategy.
// If the transport throws, the strategy re-throws so
// NotificationService's error boundary is exercised.
// ──────────────────────────────────────────────

function createStrategy(
  canal: string,
  transportFn: (n: NotificacionDTO) => Promise<void>,
): INotificationStrategy {
  const enviar = vi.fn(async (notificacion: NotificacionDTO) => {
    await transportFn(notificacion);
    return { canal, exitoso: true, timestamp: new Date().toISOString() };
  });
  return { canal, enviar };
}

// ──────────────────────────────────────────────
// Suite: NotificationService Channel Delivery
// ──────────────────────────────────────────────

describe("NotificationService — Channel Delivery", () => {
  const dummyNotification: NotificacionDTO = {
    userId: "user-test-001",
    type: "test_event",
    title: "Test Title",
    body: "Test body content",
    payload: { key: "value" },
  };

  let smtp: ReturnType<typeof createMockSMTPClient>;
  let ws: ReturnType<typeof createMockWSClient>;
  let expo: ReturnType<typeof createMockExpoClient>;
  let preferenceService: IPreferenceService;

  beforeEach(() => {
    smtp = createMockSMTPClient();
    ws = createMockWSClient();
    expo = createMockExpoClient();

    preferenceService = {
      getCanalesActivos: vi
        .fn()
        .mockResolvedValue(["smtp", "websocket", "expo"]),
      setCanalActivo: vi.fn(),
    };
  });

  // ─── Test 1: Flujo Exitoso ─────────────────
  it("debe ejecutar todos los canales activos y reportar éxito total", async () => {
    smtp.enviarEmail.mockResolvedValue(undefined);
    ws.emitToUser.mockResolvedValue(undefined);
    expo.enviarPush.mockResolvedValue(undefined);

    const strategies = [
      createStrategy("smtp", () =>
        smtp.enviarEmail(
          dummyNotification.userId,
          dummyNotification.title,
          dummyNotification.body,
        ),
      ),
      createStrategy("websocket", () =>
        ws.emitToUser(
          dummyNotification.userId,
          dummyNotification.type,
          {},
        ),
      ),
      createStrategy("expo", () =>
        expo.enviarPush(
          "expo-token-abc",
          dummyNotification.title,
          dummyNotification.body,
          {},
        ),
      ),
    ];

    const service = new NotificationService(strategies, preferenceService);
    const resumen = await service.notificar(dummyNotification);

    expect(resumen.total).toBe(3);
    expect(resumen.exitosos).toBe(3);
    expect(resumen.fallidos).toBe(0);
    expect(smtp.enviarEmail).toHaveBeenCalledTimes(1);
    expect(ws.emitToUser).toHaveBeenCalledTimes(1);
    expect(expo.enviarPush).toHaveBeenCalledTimes(1);
    resumen.resultados.forEach((r) => {
      expect(r.status).toBe("success");
    });
  });

  // ─── Test 2: Resiliencia ante Excepciones ──
  it("debe capturar error en SMTP y continuar ejecutando WebSocket y Expo", async () => {
    smtp.enviarEmail.mockRejectedValue(new Error("SMTP_CONNECTION_FAILED"));
    ws.emitToUser.mockResolvedValue(undefined);
    expo.enviarPush.mockResolvedValue(undefined);

    const strategies = [
      createStrategy("smtp", () =>
        smtp.enviarEmail(
          dummyNotification.userId,
          dummyNotification.title,
          dummyNotification.body,
        ),
      ),
      createStrategy("websocket", () =>
        ws.emitToUser(
          dummyNotification.userId,
          dummyNotification.type,
          {},
        ),
      ),
      createStrategy("expo", () =>
        expo.enviarPush(
          "expo-token-abc",
          dummyNotification.title,
          dummyNotification.body,
          {},
        ),
      ),
    ];

    const service = new NotificationService(strategies, preferenceService);
    const resumen = await service.notificar(dummyNotification);

    expect(resumen.total).toBe(3);
    expect(resumen.exitosos).toBe(2);
    expect(resumen.fallidos).toBe(1);
    expect(smtp.enviarEmail).toHaveBeenCalledTimes(1);
    expect(ws.emitToUser).toHaveBeenCalledTimes(1);
    expect(expo.enviarPush).toHaveBeenCalledTimes(1);
  });

  // ─── Test 3: Aislamiento de Errores ────────
  it("debe retornar resultados que identifiquen canales fallidos y exitosos", async () => {
    smtp.enviarEmail.mockRejectedValue(new Error("SMTP_CONNECTION_FAILED"));
    ws.emitToUser.mockResolvedValue(undefined);
    expo.enviarPush.mockRejectedValue(new Error("EXPO_TIMEOUT"));

    const strategies = [
      createStrategy("smtp", () =>
        smtp.enviarEmail(
          dummyNotification.userId,
          dummyNotification.title,
          dummyNotification.body,
        ),
      ),
      createStrategy("websocket", () =>
        ws.emitToUser(
          dummyNotification.userId,
          dummyNotification.type,
          {},
        ),
      ),
      createStrategy("expo", () =>
        expo.enviarPush(
          "expo-token-abc",
          dummyNotification.title,
          dummyNotification.body,
          {},
        ),
      ),
    ];

    const service = new NotificationService(strategies, preferenceService);
    const resumen = await service.notificar(dummyNotification);

    expect(resumen.total).toBe(3);
    expect(resumen.exitosos).toBe(1);
    expect(resumen.fallidos).toBe(2);

    const smtpResult = resumen.resultados.find((r) => r.canal === "smtp")!;
    expect(smtpResult.status).toBe("failed");
    expect(smtpResult.error).toContain("SMTP_CONNECTION_FAILED");

    const wsResult = resumen.resultados.find((r) => r.canal === "websocket")!;
    expect(wsResult.status).toBe("success");
    expect(wsResult.error).toBeUndefined();

    const expoResult = resumen.resultados.find((r) => r.canal === "expo")!;
    expect(expoResult.status).toBe("failed");
    expect(expoResult.error).toContain("EXPO_TIMEOUT");
  });
});
