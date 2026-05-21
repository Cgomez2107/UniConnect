import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../../shared/patterns/strategy/NotificationService.js";
import type { INotificationStrategy, NotificacionDTO } from "../../shared/patterns/strategy/INotificationStrategy.js";
import type { IPreferenceService } from "../../shared/patterns/strategy/IPreferenceService.js";
import type { INotificationPreferenceRepository } from "../../shared/patterns/strategy/INotificationPreferenceRepository.js";
import { SlackStrategy } from "../../shared/patterns/strategy/SlackStrategy.js";
import type { ISlackGateway } from "../../shared/patterns/strategy/SlackStrategy.js";
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
  let preferenceRepository: INotificationPreferenceRepository;

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

    preferenceRepository = {
      isChannelEnabled: vi.fn().mockResolvedValue(true),
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

    const service = new NotificationService(strategies, preferenceService, preferenceRepository);
    const resumen = await service.notificar(dummyNotification);

    expect(resumen.total).toBe(3);
    expect(resumen.exitosos).toBe(3);
    expect(resumen.fallidos).toBe(0);
    expect(resumen.omitidos).toBe(0);
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

    const service = new NotificationService(strategies, preferenceService, preferenceRepository);
    const resumen = await service.notificar(dummyNotification);

    expect(resumen.total).toBe(3);
    expect(resumen.exitosos).toBe(2);
    expect(resumen.fallidos).toBe(1);
    expect(resumen.omitidos).toBe(0);
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

    const service = new NotificationService(strategies, preferenceService, preferenceRepository);
    const resumen = await service.notificar(dummyNotification);

    expect(resumen.total).toBe(3);
    expect(resumen.exitosos).toBe(1);
    expect(resumen.fallidos).toBe(2);
    expect(resumen.omitidos).toBe(0);

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

  // ─── Test 4: Cortocircuito por Preferencias ─
  it("debe saltar (skip) el canal smtp si el usuario lo tiene desactivado", async () => {
    preferenceRepository.isChannelEnabled = vi
      .fn()
      .mockImplementation(async (_userId: string, canal: string) => canal !== "smtp");

    smtp.enviarEmail.mockRejectedValue(new Error("no debe llamarse"));
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

    const service = new NotificationService(strategies, preferenceService, preferenceRepository);
    const resumen = await service.notificar(dummyNotification);

    expect(resumen.total).toBe(3);
    expect(resumen.exitosos).toBe(2);
    expect(resumen.fallidos).toBe(0);
    expect(resumen.omitidos).toBe(1);

    const smtpResult = resumen.resultados.find((r) => r.canal === "smtp")!;
    expect(smtpResult.status).toBe("skipped");
    expect(smtpResult.error).toBeUndefined();

    expect(smtp.enviarEmail).not.toHaveBeenCalled();
    expect(ws.emitToUser).toHaveBeenCalledTimes(1);
    expect(expo.enviarPush).toHaveBeenCalledTimes(1);
  });

  // ─── Test 5: Extensibilidad — Slack ─────────
  it("debe permitir añadir Slack dinámicamente sin modificar NotificationService", async () => {
    const slackGateway: ISlackGateway = {
      enviarMensaje: vi.fn().mockResolvedValue(undefined),
    };
    const slackStrategy = new SlackStrategy(slackGateway);

    preferenceService.getCanalesActivos = vi
      .fn()
      .mockResolvedValue(["smtp", "websocket", "expo", "slack"]);

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
      slackStrategy,
    ];

    // NotificationService no se modificó para incluir Slack;
    // solo se pasó la instancia por el constructor
    const service = new NotificationService(strategies, preferenceService, preferenceRepository);
    const resumen = await service.notificar(dummyNotification);

    expect(resumen.total).toBe(4);
    expect(resumen.exitosos).toBe(4);
    expect(resumen.fallidos).toBe(0);
    expect(resumen.omitidos).toBe(0);

    const slackResult = resumen.resultados.find((r) => r.canal === "slack")!;
    expect(slackResult.status).toBe("success");
    expect(slackGateway.enviarMensaje).toHaveBeenCalledTimes(1);
    expect(slackGateway.enviarMensaje).toHaveBeenCalledWith(
      dummyNotification.userId,
      expect.stringContaining(dummyNotification.title),
    );
  });
});
