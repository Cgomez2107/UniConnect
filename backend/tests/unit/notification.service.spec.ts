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
  const enviarEmail = vi.fn<(userId: string, title: string, body: string) => Promise<void>>();
  const instance: IEmailGateway = { enviarEmail };
  return { instance, enviarEmail };
}

function createMockWSClient() {
  const emitToUser = vi.fn<(userId: string, type: string, payload: Record<string, unknown>) => Promise<void>>();
  const instance: IStudyGroupSocketGateway = { emitToUser };
  return { instance, emitToUser };
}

function createMockExpoClient() {
  const enviarPush = vi.fn<(token: string, title: string, body: string, data: Record<string, unknown>) => Promise<void>>();
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

// ──────────────────────────────────────────────
// Suite: US-MO02 CA1 — Notification latency < 500ms
// ──────────────────────────────────────────────
describe("US-MO02 CA1 — Notification delivery under 500ms", () => {
  const moderationNotification: NotificacionDTO = {
    userId: "user-spam-001",
    type: "moderation_escalation",
    title: "Escalación de Moderación Reincidente",
    body: "El usuario ha alcanzado el límite de 3 bloqueos en 1 hora por spam.",
    payload: { userId: "user-spam-001", reason: "Spam block limit reached" },
    priority: "critica",
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
      getCanalesActivos: vi.fn().mockResolvedValue(["smtp", "websocket", "expo"]),
      setCanalActivo: vi.fn(),
    };

    preferenceRepository = {
      isChannelEnabled: vi.fn().mockResolvedValue(true),
    };
  });

  it("envía notificación de moderación a 3 canales en paralelo en menos de 500ms", async () => {
    const CHANNEL_DELAY_MS = 120;

    smtp.enviarEmail.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, CHANNEL_DELAY_MS)),
    );
    ws.emitToUser.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, CHANNEL_DELAY_MS)),
    );
    expo.enviarPush.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, CHANNEL_DELAY_MS)),
    );

    const strategies = [
      createStrategy("smtp", () =>
        smtp.enviarEmail(moderationNotification.userId, moderationNotification.title, moderationNotification.body),
      ),
      createStrategy("websocket", () =>
        ws.emitToUser(moderationNotification.userId, moderationNotification.type, {}),
      ),
      createStrategy("expo", () =>
        expo.enviarPush("expo-token-mo", moderationNotification.title, moderationNotification.body, {}),
      ),
    ];

    const service = new NotificationService(strategies, preferenceService, preferenceRepository);
    const start = performance.now();
    const resumen = await service.notificar(moderationNotification);
    const elapsed = performance.now() - start;

    expect(resumen.exitosos).toBe(3);
    expect(resumen.fallidos).toBe(0);
    expect(elapsed).toBeLessThan(500);
  });

  it("entrega notificación de moderación incluso si un canal es lento, total < 500ms", async () => {
    smtp.enviarEmail.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, 400)),
    );
    ws.emitToUser.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, 50)),
    );
    expo.enviarPush.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, 80)),
    );

    const strategies = [
      createStrategy("smtp", () =>
        smtp.enviarEmail(moderationNotification.userId, moderationNotification.title, moderationNotification.body),
      ),
      createStrategy("websocket", () =>
        ws.emitToUser(moderationNotification.userId, moderationNotification.type, {}),
      ),
      createStrategy("expo", () =>
        expo.enviarPush("expo-token-mo", moderationNotification.title, moderationNotification.body, {}),
      ),
    ];

    const service = new NotificationService(strategies, preferenceService, preferenceRepository);
    const start = performance.now();
    const resumen = await service.notificar(moderationNotification);
    const elapsed = performance.now() - start;

    expect(resumen.exitosos).toBe(3);
    expect(elapsed).toBeLessThan(500);
  });

  it("notificación rápida de bloqueo MO_003 con canal websocket < 500ms", async () => {
    ws.emitToUser.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, 30)),
    );
    expo.enviarPush.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, 60)),
    );

    const blockNotification: NotificacionDTO = {
      userId: "user-spam-001",
      type: "moderation_block",
      title: "Mensaje bloqueado",
      body: "Tu mensaje fue bloqueado por spam detectado. Podrás enviar mensajes en 5 minutos.",
      payload: { reason: "MO_003", remainingMs: 300000 },
      priority: "urgente",
    };

    preferenceService.getCanalesActivos = vi.fn().mockResolvedValue(["websocket", "expo"]);

    const strategies = [
      createStrategy("websocket", () =>
        ws.emitToUser(blockNotification.userId, blockNotification.type, {}),
      ),
      createStrategy("expo", () =>
        expo.enviarPush("expo-token-mo", blockNotification.title, blockNotification.body, {}),
      ),
    ];

    const service = new NotificationService(strategies, preferenceService, preferenceRepository);
    const start = performance.now();
    const resumen = await service.notificar(blockNotification);
    const elapsed = performance.now() - start;

    expect(resumen.exitosos).toBe(2);
    expect(elapsed).toBeLessThan(500);
  });

  it("canal fallido no bloquea la entrega — el canal más rápido responde < 500ms", async () => {
    smtp.enviarEmail.mockRejectedValue(new Error("SMTP_TIMEOUT"));

    ws.emitToUser.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, 40)),
    );
    expo.enviarPush.mockImplementation(
      () => new Promise<void>((r) => setTimeout(r, 50)),
    );

    const strategies = [
      createStrategy("smtp", () =>
        smtp.enviarEmail(moderationNotification.userId, moderationNotification.title, moderationNotification.body),
      ),
      createStrategy("websocket", () =>
        ws.emitToUser(moderationNotification.userId, moderationNotification.type, {}),
      ),
      createStrategy("expo", () =>
        expo.enviarPush("expo-token-mo", moderationNotification.title, moderationNotification.body, {}),
      ),
    ];

    const service = new NotificationService(strategies, preferenceService, preferenceRepository);
    const start = performance.now();
    const resumen = await service.notificar(moderationNotification);
    const elapsed = performance.now() - start;

    expect(resumen.exitosos).toBe(2);
    expect(resumen.fallidos).toBe(1);
    expect(elapsed).toBeLessThan(500);
  });
});
