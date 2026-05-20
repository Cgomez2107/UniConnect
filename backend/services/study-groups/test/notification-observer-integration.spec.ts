import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { StudyGroupEvent } from "../src/domain/events/StudyGroupEvents.js";
import type { INotificationRepository } from "../src/domain/repositories/INotificationRepository.js";
import type { NotificacionDTO } from "../../../shared/patterns/strategy/INotificationStrategy.js";
import { NotificationService, type ResumenNotificacion } from "../../../shared/patterns/strategy/NotificationService.js";
import { NotificationMapper } from "../src/application/services/NotificationMapper.js";
import { NotificationObserver } from "../src/domain/events/observers/NotificationObserver.js";
import type { INotificationStrategy } from "../../../shared/patterns/strategy/INotificationStrategy.js";
import type { IPreferenceService } from "../../../shared/patterns/strategy/IPreferenceService.js";

type SpyFn<Args extends unknown[], Return> = ((...args: Args) => Return) & {
  mock: { calls: Args[] };
  mockResolvedValue(value: Awaited<Return>): void;
  mockImplementation(fn: (...args: Args) => Return): void;
};

function createSpy<Args extends unknown[], Return>(): SpyFn<Args, Return> {
  let impl: ((...args: Args) => Return) | undefined;

  const spy = ((...args: Args) => {
    spy.mock.calls.push(args);
    if (impl) { return impl(...args); }
    return undefined as Return;
  }) as unknown as SpyFn<Args, Return>;
  spy.mock = { calls: [] };
  spy.mockResolvedValue = (value) => {
    impl = ((...args: Args) => Promise.resolve(value) as Return);
  };
  spy.mockImplementation = (fn) => {
    impl = fn;
  };
  return spy;
}

const DUMMY_EVENT: StudyGroupEvent = {
  type: "JOIN_REQUEST",
  version: "1.0",
  timestamp: new Date("2026-05-11T12:00:00.000Z"),
  requestId: "req-integration",
  applicantId: "user-applicant",
  recipientUserId: "user-recipient",
  message: "Quiero unirme al grupo",
  groupName: "Grupo de Historia",
  applicantName: "Maria Lopez",
};

const BASE_TIME = new Date("2026-05-11T12:00:00.000Z");

describe("NotificationObserver → NotificationService — flujo completo", () => {
  it("delegada en NotificationService sin persistencia duplicada en el observer", async () => {
    const repoSpy = createSpy<[{
      userId: string; type: string; title: string; body: string; payload: Record<string, unknown> | null;
    }], Promise<string>>();
    repoSpy.mockResolvedValue("notif-001");

    let capturedDto: NotificacionDTO | null = null;
    const mockStrategy: INotificationStrategy = {
      canal: "test_channel",
      async enviar(dto: NotificacionDTO) {
        capturedDto = dto;
        return { canal: "test_channel", exitoso: true, timestamp: new Date().toISOString() };
      },
    };
    const prefService: IPreferenceService = {
      async getCanalesActivos() { return ["test_channel"]; },
      async setCanalActivo() {},
    };
    const notificationService = new NotificationService([mockStrategy], prefService);
    const mapper = new NotificationMapper();
    const observer = new NotificationObserver(
      { create: repoSpy as unknown as INotificationRepository["create"], listByUser: async () => [] },
      notificationService,
      mapper,
    );

    await observer.handle(DUMMY_EVENT);

    assert.equal(repoSpy.mock.calls.length, 0);

    assert.ok(capturedDto !== null, "NotificationService.notificar() deberia haber sido llamado");
    const dtoResult: NotificacionDTO = capturedDto as NotificacionDTO;
    assert.equal(dtoResult.userId, "user-recipient");
    assert.equal(dtoResult.type, "solicitud_ingreso");
    assert.equal(dtoResult.title, "Grupo de Historia");
  });

  it("invoca estrategias activas con el DTO mapeado", async () => {
    const repoSpy = createSpy<[Record<string, unknown>], Promise<string>>();
    repoSpy.mockResolvedValue("notif-002");

    const wsSpy = createSpy<[NotificacionDTO], Promise<{ canal: string; exitoso: boolean; timestamp: string }>>();
    wsSpy.mockResolvedValue({ canal: "in_app_websocket", exitoso: true, timestamp: new Date().toISOString() });

    const emailSpy = createSpy<[NotificacionDTO], Promise<{ canal: string; exitoso: boolean; timestamp: string }>>();
    emailSpy.mockResolvedValue({ canal: "email_institucional", exitoso: true, timestamp: new Date().toISOString() });

    const strategies = [
      { canal: "in_app_websocket", enviar: wsSpy as unknown as INotificationStrategy["enviar"] },
      { canal: "email_institucional", enviar: emailSpy as unknown as INotificationStrategy["enviar"] },
    ] as INotificationStrategy[];

    const prefService: IPreferenceService = {
      async getCanalesActivos() { return ["in_app_websocket", "email_institucional"]; },
      async setCanalActivo() {},
    };
    const notificationService = new NotificationService(strategies, prefService);
    const mapper = new NotificationMapper();
    const observer = new NotificationObserver(
      { create: repoSpy as unknown as INotificationRepository["create"], listByUser: async () => [] },
      notificationService,
      mapper,
    );

    await observer.handle(DUMMY_EVENT);

    assert.equal(wsSpy.mock.calls.length, 1, "websocket strategy should be called");
    assert.equal(emailSpy.mock.calls.length, 1, "email strategy should be called");
    assert.equal(wsSpy.mock.calls[0][0].type, "solicitud_ingreso");
    assert.equal(emailSpy.mock.calls[0][0].type, "solicitud_ingreso");
  });
});
