import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "../INotificationStrategy.js";
import type { IPreferenceService } from "../IPreferenceService.js";
import { InAppWebSocketStrategy, type IStudyGroupSocketGateway } from "../InAppWebSocketStrategy.js";
import { EmailInstitucionalStrategy, type IEmailGateway } from "../EmailInstitucionalStrategy.js";
import { PushMovilStrategy, type IPushGateway } from "../PushMovilStrategy.js";
import { NotificationService, type ResumenNotificacion } from "../NotificationService.js";

const dummyNotificacion: NotificacionDTO = {
  userId: "user_test_001",
  type: "NUEVO_EVENTO",
  title: "Evento de prueba",
  body: "Este es un cuerpo de prueba",
  payload: { key: "value" },
};

class MockStrategy implements INotificationStrategy {
  readonly canal: string;
  private readonly shouldFail: boolean;

  constructor(canal: string, shouldFail = false) {
    this.canal = canal;
    this.shouldFail = shouldFail;
  }

  async enviar(_notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    if (this.shouldFail) {
      return { canal: this.canal, exitoso: false, error: "Fallo simulado", timestamp: new Date().toISOString() };
    }
    return { canal: this.canal, exitoso: true, timestamp: new Date().toISOString() };
  }
}

class MockPreferenceService implements IPreferenceService {
  private readonly canales: Map<string, string[]> = new Map();

  setCanales(userId: string, eventType: string, canales: string[]) {
    this.canales.set(`${userId}:${eventType}`, canales);
  }

  async getCanalesActivos(userId: string, eventType: string): Promise<string[]> {
    return this.canales.get(`${userId}:${eventType}`) ?? [];
  }

  async setCanalActivo(_userId: string, _eventType: string, _canal: string, _activo: boolean): Promise<void> {
    // no-op for tests
  }
}

describe("AC-01: Mock implementa INotificationStrategy y NotificationService lo acepta", () => {
  it("MockStrategy debe cumplir la interfaz INotificationStrategy", () => {
    const mock = new MockStrategy("test_canal");
    assert.equal(mock.canal, "test_canal");
  });

  it("NotificationService debe aceptar mocks como estrategias", () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["test_canal"]);

    const service = new NotificationService([new MockStrategy("test_canal")], preferenceService);
    assert.ok(service instanceof NotificationService);
  });

  it("NotificationService.notificar debe retornar ResumenNotificacion con mock", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["canal_a"]);

    const service = new NotificationService([new MockStrategy("canal_a")], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 1);
    assert.equal(resumen.exitosos, 1);
    assert.equal(resumen.fallidos, 0);
    assert.equal(resumen.resultados[0].canal, "canal_a");
    assert.equal(resumen.resultados[0].exitoso, true);
  });
});

describe("AC-02: Estrategias concretas tienen canal definido y retornan ResultadoEnvio", () => {
  let wsStrategy: InAppWebSocketStrategy;
  let emailStrategy: EmailInstitucionalStrategy;
  let pushStrategy: PushMovilStrategy;

  before(() => {
    const mockGateway: IStudyGroupSocketGateway = { emitToUser: async () => {} };
    const mockEmail: IEmailGateway = { enviarEmail: async () => {} };
    const mockPush: IPushGateway = { enviarPush: async () => {} };

    wsStrategy = new InAppWebSocketStrategy(mockGateway);
    emailStrategy = new EmailInstitucionalStrategy(mockEmail);
    pushStrategy = new PushMovilStrategy(mockPush);
  });

  it("InAppWebSocketStrategy tiene canal 'in_app_websocket'", () => {
    assert.equal(wsStrategy.canal, "in_app_websocket");
  });

  it("EmailInstitucionalStrategy tiene canal 'email_institucional'", () => {
    assert.equal(emailStrategy.canal, "email_institucional");
  });

  it("PushMovilStrategy tiene canal 'push_movil'", () => {
    assert.equal(pushStrategy.canal, "push_movil");
  });

  it("InAppWebSocketStrategy retorna ResultadoEnvio exitoso", async () => {
    const resultado = await wsStrategy.enviar(dummyNotificacion);
    assert.equal(resultado.canal, "in_app_websocket");
    assert.equal(resultado.exitoso, true);
    assert.ok(resultado.timestamp);
  });

  it("EmailInstitucionalStrategy retorna ResultadoEnvio exitoso", async () => {
    const resultado = await emailStrategy.enviar(dummyNotificacion);
    assert.equal(resultado.canal, "email_institucional");
    assert.equal(resultado.exitoso, true);
    assert.ok(resultado.timestamp);
  });

  it("PushMovilStrategy retorna ResultadoEnvio exitoso", async () => {
    const resultado = await pushStrategy.enviar(dummyNotificacion);
    assert.equal(resultado.canal, "push_movil");
    assert.equal(resultado.exitoso, true);
    assert.ok(resultado.timestamp);
  });
});

describe("AC-03: NotificationService no instancia estrategias internamente", () => {
  it("getStrategies debe retornar las mismas instancias inyectadas", () => {
    const preferenceService = new MockPreferenceService();
    const strategies = [new MockStrategy("a"), new MockStrategy("b")];
    const service = new NotificationService(strategies, preferenceService);

    assert.equal(service.getStrategies().length, 2);
    assert.equal(service.getStrategies()[0].canal, "a");
    assert.equal(service.getStrategies()[1].canal, "b");
  });

  it("NotificationService no tiene método para añadir estrategias después de construcción", () => {
    const preferenceService = new MockPreferenceService();
    const service = new NotificationService([], preferenceService);

    // Verificar que no existe método addStrategy
    assert.equal((service as Record<string, unknown>).addStrategy, undefined);
    assert.equal((service as Record<string, unknown>).addStrategies, undefined);
  });
});

describe("AC-04: Filtro por preferencias - solo canales activos se ejecutan", () => {
  it("debe ejecutar solo los canales activos según IPreferenceService", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["canal_b"]);

    const canalA = new MockStrategy("canal_a");
    const canalB = new MockStrategy("canal_b");
    const canalC = new MockStrategy("canal_c");

    const service = new NotificationService([canalA, canalB, canalC], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 1);
    assert.equal(resumen.resultados[0].canal, "canal_b");
  });

  it("debe retornar total 0 si ningún canal está activo", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, []);

    const service = new NotificationService([new MockStrategy("a")], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 0);
    assert.equal(resumen.exitosos, 0);
    assert.equal(resumen.fallidos, 0);
  });

  it("debe ejecutar todos los canales si getCanalesActivos retorna la lista completa", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["a", "b", "c"]);

    const service = new NotificationService([
      new MockStrategy("a"),
      new MockStrategy("b"),
      new MockStrategy("c"),
    ], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 3);
  });
});

describe("AC-05: Aislamiento de fallos - una estrategia falla, las demás continúan", () => {
  it("debe retornar resumen con 2 exitosos y 1 fallido", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["a", "b", "c"]);

    const service = new NotificationService([
      new MockStrategy("a", false),
      new MockStrategy("b", true),
      new MockStrategy("c", false),
    ], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 2);
    assert.equal(resumen.fallidos, 1);
    assert.equal(resumen.resultados[0].exitoso, true);
    assert.equal(resumen.resultados[0].canal, "a");
    assert.equal(resumen.resultados[1].exitoso, false);
    assert.equal(resumen.resultados[1].canal, "b");
    assert.equal(resumen.resultados[1].error, "Fallo simulado");
    assert.equal(resumen.resultados[2].exitoso, true);
    assert.equal(resumen.resultados[2].canal, "c");
  });

  it("debe retornar todos fallidos si todas fallan", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["a", "b"]);

    const service = new NotificationService([
      new MockStrategy("a", true),
      new MockStrategy("b", true),
    ], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 2);
    assert.equal(resumen.exitosos, 0);
    assert.equal(resumen.fallidos, 2);
  });
});

describe("AC-06: Open/Closed - nueva estrategia se añade sin modificar NotificationService", () => {
  it("debe funcionar con una nueva estrategia sin modificar el contexto", async () => {
    class SmsStrategy implements INotificationStrategy {
      readonly canal = "sms";
      async enviar(_n: NotificacionDTO): Promise<ResultadoEnvio> {
        return { canal: "sms", exitoso: true, timestamp: new Date().toISOString() };
      }
    }

    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["sms", "canal_a"]);

    const service = new NotificationService([new MockStrategy("canal_a"), new SmsStrategy()], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 2);
    assert.equal(resumen.exitosos, 2);
    assert.equal(resumen.resultados[0].canal, "canal_a");
    assert.equal(resumen.resultados[1].canal, "sms");
  });

  it("la nueva estrategia puede convivir con las existentes", async () => {
    class SlackStrategy implements INotificationStrategy {
      readonly canal = "slack";
      async enviar(_n: NotificacionDTO): Promise<ResultadoEnvio> {
        return { canal: "slack", exitoso: true, timestamp: new Date().toISOString() };
      }
    }

    const mockEmail: IEmailGateway = { enviarEmail: async () => {} };
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["slack", "email_institucional"]);

    const service = new NotificationService([new SlackStrategy(), new EmailInstitucionalStrategy(mockEmail)], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 2);
    assert.equal(resumen.resultados[0].canal, "slack");
    assert.equal(resumen.resultados[1].canal, "email_institucional");
  });
});
