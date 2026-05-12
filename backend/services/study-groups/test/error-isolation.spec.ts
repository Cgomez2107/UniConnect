import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NotificationService, type ResumenNotificacion } from "../../../shared/patterns/strategy/NotificationService.js";
import type { INotificationStrategy, NotificacionDTO } from "../../../shared/patterns/strategy/INotificationStrategy.js";
import type { IPreferenceService } from "../../../shared/patterns/strategy/IPreferenceService.js";

type SpyFn<Args extends unknown[], Return> = ((...args: Args) => Return) & {
  mock: { calls: Args[] };
};

function createSpy<Args extends unknown[], Return>(): SpyFn<Args, Return> {
  const spy = ((...args: Args) => {
    spy.mock.calls.push(args);
    return undefined as Return;
  }) as SpyFn<Args, Return>;
  spy.mock = { calls: [] };
  return spy;
}

const DTO: NotificacionDTO = {
  userId: "user-001",
  type: "SOLICITUD_INGRESO",
  title: "Prueba",
  body: "Cuerpo de prueba",
  payload: null,
};

const prefAllActive: IPreferenceService = {
  async getCanalesActivos() { return ["in_app_websocket", "email_institucional", "push_movil"]; },
  async setCanalActivo() {},
};

describe("Error isolation — SendGrid timeout, WebSocket succeeds", () => {
  it("cuando email lanza error de red, websocket y push se envian correctamente", async () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    try {
      const strategies: INotificationStrategy[] = [
        {
          canal: "in_app_websocket",
          async enviar() {
            return { canal: "in_app_websocket", exitoso: true, timestamp: new Date().toISOString() };
          },
        },
        {
          canal: "email_institucional",
          async enviar() {
            await new Promise((_, reject) =>
              setTimeout(() => reject(new Error("ETIMEDOUT: conexion con smtp.sendgrid.net agotada")), 5),
            );
            throw new Error("unreachable");
          },
        },
        {
          canal: "push_movil",
          async enviar() {
            return { canal: "push_movil", exitoso: true, timestamp: new Date().toISOString() };
          },
        },
      ];

      const service = new NotificationService(strategies, prefAllActive);
      const resumen = await service.notificar(DTO);

      assert.equal(resumen.total, 3, "las 3 estrategias deben ejecutarse");
      assert.equal(resumen.exitosos, 2, "websocket + push = 2 exitosos");
      assert.equal(resumen.fallidos, 1, "email = 1 fallido");
      assert.equal(resumen.resultados[0].canal, "in_app_websocket");
      assert.equal(resumen.resultados[0].exitoso, true);
      assert.equal(resumen.resultados[1].canal, "email_institucional");
      assert.equal(resumen.resultados[1].exitoso, false);
      assert.equal(resumen.resultados[2].canal, "push_movil");
      assert.equal(resumen.resultados[2].exitoso, true);
    } finally {
      console.log = originalLog;
    }
  });

  it("no se filtraron API keys en los logs de error", async () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    try {
      const strategyThatLeaks: INotificationStrategy = {
        canal: "leak_test",
        async enviar() {
          const fakeError = new Error(
            "sendgrid error: The provided authorization grant is invalid, expired, or revoked. " +
            "API Key: SG.abc123def456ghi789jkl",
          );
          throw fakeError;
        },
      };

      const pref: IPreferenceService = {
        async getCanalesActivos() { return ["leak_test"]; },
        async setCanalActivo() {},
      };

      const service = new NotificationService([strategyThatLeaks], pref);
      const resumen = await service.notificar(DTO);

      assert.equal(resumen.fallidos, 1);
      const errorMsg = resumen.resultados[0].error ?? "";
      assert.ok(errorMsg.includes("authorization grant"), "debe incluir mensaje de error");

      const apiKeyPattern = /SG\.[a-zA-Z0-9._-]{10,}/;
      const leakedInResult = apiKeyPattern.test(errorMsg);
      assert.equal(leakedInResult, false, "ResultadoEnvio.error NO debe contener la API Key literal");

      const leakedInLogs = logs.some((l) => apiKeyPattern.test(l));
      assert.equal(leakedInLogs, false, "console.log NO debe contener la API Key literal");
    } finally {
      console.log = originalLog;
    }
  });
});

describe("Error isolation — mixed failures", () => {
  it("2 exitosos, 1 fallido con error message preservado", async () => {
    const strategies: INotificationStrategy[] = [
      {
        canal: "push_movil",
        async enviar() {
          return { canal: "push_movil", exitoso: true, timestamp: new Date().toISOString() };
        },
      },
      {
        canal: "in_app_websocket",
        async enviar() {
          throw new Error("WebSocket connection refused");
        },
      },
      {
        canal: "email_institucional",
        async enviar() {
          return { canal: "email_institucional", exitoso: true, timestamp: new Date().toISOString() };
        },
      },
    ];

    const service = new NotificationService(strategies, prefAllActive);
    const resumen = await service.notificar(DTO);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 2);
    assert.equal(resumen.fallidos, 1);
    assert.equal(resumen.resultados[1].exitoso, false);
    assert.equal(resumen.resultados[1].error, "WebSocket connection refused");
  });

  it("0 exitosos si todas fallan, sin lanzar excepcion", async () => {
    const strategies: INotificationStrategy[] = [
      {
        canal: "in_app_websocket",
        async enviar() { throw new Error("ws fail"); },
      },
      {
        canal: "email_institucional",
        async enviar() { throw new Error("email fail"); },
      },
    ];

    const pref: IPreferenceService = {
      async getCanalesActivos() { return ["in_app_websocket", "email_institucional"]; },
      async setCanalActivo() {},
    };

    const service = new NotificationService(strategies, pref);
    const resumen = await service.notificar(DTO);

    assert.equal(resumen.total, 2);
    assert.equal(resumen.exitosos, 0);
    assert.equal(resumen.fallidos, 2);
  });
});
