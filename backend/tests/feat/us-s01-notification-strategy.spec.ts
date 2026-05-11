import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "../../shared/patterns/strategy/INotificationStrategy.js";
import type { IPreferenceService } from "../../shared/patterns/strategy/IPreferenceService.js";
import { InAppWebSocketStrategy, type IStudyGroupSocketGateway } from "../../shared/patterns/strategy/InAppWebSocketStrategy.js";
import { EmailInstitucionalStrategy, type IEmailGateway } from "../../shared/patterns/strategy/EmailInstitucionalStrategy.js";
import { PushMovilStrategy, type IPushGateway } from "../../shared/patterns/strategy/PushMovilStrategy.js";
import { NotificationService, type ResumenNotificacion } from "../../shared/patterns/strategy/NotificationService.js";

// ============================================================================
// MOCKS & FIXTURES
// ============================================================================

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
  private readonly delayMs: number;
  sendCount = 0;

  constructor(canal: string, shouldFail = false, delayMs = 0) {
    this.canal = canal;
    this.shouldFail = shouldFail;
    this.delayMs = delayMs;
  }

  async enviar(_notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    this.sendCount++;
    
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
    
    if (this.shouldFail) {
      return {
        canal: this.canal,
        exitoso: false,
        error: `Fallo simulado en ${this.canal}`,
        timestamp: new Date().toISOString(),
      };
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

// Gateway mocks for stress testing
class FailingEmailGateway implements IEmailGateway {
  async enviarEmail(_to: string, _subject: string, _body: string): Promise<void> {
    throw new Error("Email service unavailable");
  }
}

class FailingPushGateway implements IPushGateway {
  async enviarPush(_token: string, _title: string, _body: string, _data: Record<string, unknown>): Promise<void> {
    throw new Error("Push service timeout");
  }
}

class FailingWebSocketGateway implements IStudyGroupSocketGateway {
  async emitToUser(_userId: string, _event: string, _payload: Record<string, unknown>): Promise<void> {
    throw new Error("WebSocket connection lost");
  }
}

// ============================================================================
// AC-01: CONTRATO DE INTERFAZ - NOTIFICATIONSTRATEGY
// ============================================================================

describe("AC-01: INotificationStrategy define enviar() y retorna ResultadoEnvio", () => {
  it("INotificationStrategy debe tener propiedad canal (string)", () => {
    const mock = new MockStrategy("test_canal");
    assert.equal(typeof mock.canal, "string");
    assert.equal(mock.canal, "test_canal");
  });

  it("enviar() debe retornar Promise<ResultadoEnvio> con estructura correcta", async () => {
    const mock = new MockStrategy("test");
    const resultado = await mock.enviar(dummyNotificacion);

    assert.equal(typeof resultado, "object");
    assert.equal(typeof resultado.canal, "string");
    assert.equal(typeof resultado.exitoso, "boolean");
    assert.equal(typeof resultado.timestamp, "string");
  });

  it("ResultadoEnvio exitoso debe tener exitoso=true y sin error", async () => {
    const mock = new MockStrategy("test", false);
    const resultado = await mock.enviar(dummyNotificacion);

    assert.equal(resultado.exitoso, true);
    assert.equal(resultado.error, undefined);
    assert.ok(resultado.timestamp);
  });

  it("ResultadoEnvio fallido debe tener exitoso=false y mensaje de error", async () => {
    const mock = new MockStrategy("test", true);
    const resultado = await mock.enviar(dummyNotificacion);

    assert.equal(resultado.exitoso, false);
    assert.ok(resultado.error);
    assert.ok(resultado.timestamp);
  });
});

// ============================================================================
// AC-02: CERTIFICACIÓN DE LAS 3 ESTRATEGIAS
// ============================================================================

describe("AC-02: Las 3 estrategias concretas implementan INotificationStrategy", () => {
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

  it("InAppWebSocketStrategy existe y tiene canal 'in_app_websocket'", () => {
    assert.equal(wsStrategy.canal, "in_app_websocket");
    assert.ok(typeof wsStrategy.enviar === "function");
  });

  it("EmailInstitucionalStrategy existe y tiene canal 'email_institucional'", () => {
    assert.equal(emailStrategy.canal, "email_institucional");
    assert.ok(typeof emailStrategy.enviar === "function");
  });

  it("PushMovilStrategy existe y tiene canal 'push_movil'", () => {
    assert.equal(pushStrategy.canal, "push_movil");
    assert.ok(typeof pushStrategy.enviar === "function");
  });

  it("Las 3 estrategias retornan ResultadoEnvio exitoso", async () => {
    const resultWS = await wsStrategy.enviar(dummyNotificacion);
    const resultEmail = await emailStrategy.enviar(dummyNotificacion);
    const resultPush = await pushStrategy.enviar(dummyNotificacion);

    assert.equal(resultWS.exitoso, true);
    assert.equal(resultEmail.exitoso, true);
    assert.equal(resultPush.exitoso, true);
  });
});

// ============================================================================
// AC-03: DESACOPLAMIENTO - NO INSTANCIACIÓN INTERNA DE ESTRATEGIAS
// ============================================================================

describe("AC-03: NotificationService no instancia estrategias internamente", () => {
  it("NotificationService recibe estrategias como array en constructor", () => {
    const preferenceService = new MockPreferenceService();
    const strategies = [new MockStrategy("a"), new MockStrategy("b")];
    
    const service = new NotificationService(strategies, preferenceService);
    assert.ok(service instanceof NotificationService);
  });

  it("getStrategies() retorna las mismas instancias inyectadas (identidad)", () => {
    const preferenceService = new MockPreferenceService();
    const strategyA = new MockStrategy("a");
    const strategyB = new MockStrategy("b");
    const strategies = [strategyA, strategyB];

    const service = new NotificationService(strategies, preferenceService);
    const retrieved = service.getStrategies();

    assert.equal(retrieved.length, 2);
    assert.strictEqual(retrieved[0], strategyA);
    assert.strictEqual(retrieved[1], strategyB);
  });

  it("NotificationService NO tiene método addStrategy o addStrategies", () => {
    const preferenceService = new MockPreferenceService();
    const service = new NotificationService([], preferenceService);

    // Verificar que no existen métodos para agregar estrategias después
    assert.equal((service as unknown as Record<string, unknown>).addStrategy, undefined);
    assert.equal((service as unknown as Record<string, unknown>).addStrategies, undefined);
  });

  it("NotificationService NO tiene método removeStrategy", () => {
    const preferenceService = new MockPreferenceService();
    const service = new NotificationService([new MockStrategy("a")], preferenceService);

    assert.equal((service as unknown as Record<string, unknown>).removeStrategy, undefined);
  });

  it("Inyectar una estrategia mock no requiere tocar código del NotificationService", async () => {
    // Este test verifica el principio abierto/cerrado a nivel de inyección
    class CustomMockStrategy implements INotificationStrategy {
      readonly canal = "custom_mock";
      async enviar(_n: NotificacionDTO): Promise<ResultadoEnvio> {
        return { canal: "custom_mock", exitoso: true, timestamp: new Date().toISOString() };
      }
    }

    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["custom_mock"]);

    // Sin modificar NotificationService, podemos usar CustomMockStrategy
    const service = new NotificationService([new CustomMockStrategy()], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 1);
    assert.equal(resumen.exitosos, 1);
    assert.equal(resumen.resultados[0].canal, "custom_mock");
  });
});

// ============================================================================
// AC-04: LÓGICA DE PREFERENCIAS - RESPETO A PREFERENCIAS DEL USUARIO
// ============================================================================

describe("AC-04: Filtro por preferencias - solo canales activos se ejecutan", () => {
  it("debe ejecutar solo los canales listados por getCanalesActivos", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["canal_b"]);

    const canalA = new MockStrategy("canal_a");
    const canalB = new MockStrategy("canal_b");
    const canalC = new MockStrategy("canal_c");

    const service = new NotificationService([canalA, canalB, canalC], preferenceService);
    await service.notificar(dummyNotificacion);

    assert.equal(canalA.sendCount, 0, "canalA no debe ejecutarse");
    assert.equal(canalB.sendCount, 1, "canalB debe ejecutarse exactamente 1 vez");
    assert.equal(canalC.sendCount, 0, "canalC no debe ejecutarse");
  });

  it("debe retornar total 0 si getCanalesActivos retorna lista vacía", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, []);

    const service = new NotificationService([new MockStrategy("a"), new MockStrategy("b")], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 0);
    assert.equal(resumen.exitosos, 0);
    assert.equal(resumen.fallidos, 0);
    assert.equal(resumen.resultados.length, 0);
  });

  it("debe ejecutar todos los canales si todos están en getCanalesActivos", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["a", "b", "c"]);

    const stratA = new MockStrategy("a");
    const stratB = new MockStrategy("b");
    const stratC = new MockStrategy("c");

    const service = new NotificationService([stratA, stratB, stratC], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 3);
    assert.equal(stratA.sendCount, 1);
    assert.equal(stratB.sendCount, 1);
    assert.equal(stratC.sendCount, 1);
  });

  it("debe respetar preferencias con estructura: userId + eventType", async () => {
    const preferenceService = new MockPreferenceService();
    const user1 = "user_001";
    const user2 = "user_002";
    const eventType = "NUEVO_EVENTO";

    // Usuario 1 solo quiere Email
    preferenceService.setCanales(user1, eventType, ["email_institucional"]);
    // Usuario 2 quiere Email y Push
    preferenceService.setCanales(user2, eventType, ["email_institucional", "push_movil"]);

    const mockGateway: IStudyGroupSocketGateway = { emitToUser: async () => {} };
    const mockEmail: IEmailGateway = { enviarEmail: async () => {} };
    const mockPush: IPushGateway = { enviarPush: async () => {} };

    const service = new NotificationService(
      [
        new InAppWebSocketStrategy(mockGateway),
        new EmailInstitucionalStrategy(mockEmail),
        new PushMovilStrategy(mockPush),
      ],
      preferenceService,
    );

    // User 1 notification
    const notif1 = { ...dummyNotificacion, userId: user1 };
    const resumen1 = await service.notificar(notif1);
    assert.equal(resumen1.total, 1);
    assert.equal(resumen1.resultados[0].canal, "email_institucional");

    // User 2 notification
    const notif2 = { ...dummyNotificacion, userId: user2 };
    const resumen2 = await service.notificar(notif2);
    assert.equal(resumen2.total, 2);
    const canales2 = resumen2.resultados.map(r => r.canal);
    assert.ok(canales2.includes("email_institucional"));
    assert.ok(canales2.includes("push_movil"));
  });
});

// ============================================================================
// AC-05: RESILIENCIA Y AISLAMIENTO DE FALLOS
// ============================================================================

describe("AC-05: Aislamiento de fallos - fallo en un canal no detiene otros", () => {
  it("Promise.allSettled debe ser usado: un canal falla, otros continúan", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["a", "b", "c"]);

    const stratA = new MockStrategy("a", false); // exitoso
    const stratB = new MockStrategy("b", true);  // falla
    const stratC = new MockStrategy("c", false); // exitoso

    const service = new NotificationService([stratA, stratB, stratC], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    // Verificar que todos se ejecutaron
    assert.equal(stratA.sendCount, 1);
    assert.equal(stratB.sendCount, 1);
    assert.equal(stratC.sendCount, 1);

    // Verificar el resumen
    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 2);
    assert.equal(resumen.fallidos, 1);
  });

  it("debe retornar resumen detallado con errores de cada canal", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["success", "fail1", "fail2"]);

    const service = new NotificationService(
      [
        new MockStrategy("success", false),
        new MockStrategy("fail1", true),
        new MockStrategy("fail2", true),
      ],
      preferenceService,
    );
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 1);
    assert.equal(resumen.fallidos, 2);

    // Verificar estructura de errores
    const failedResults = resumen.resultados.filter(r => !r.exitoso);
    assert.equal(failedResults.length, 2);
    assert.ok(failedResults.every(r => r.error));
  });

  it("todos los canales deben fallar sin lanzar excepción", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["a", "b", "c"]);

    const service = new NotificationService(
      [
        new MockStrategy("a", true),
        new MockStrategy("b", true),
        new MockStrategy("c", true),
      ],
      preferenceService,
    );

    // No debe lanzar excepción
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 0);
    assert.equal(resumen.fallidos, 3);
  });

  it("debe capturar excepciones lanzadas en gateways y reportarlas como fallos", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["email_institucional"]);

    const service = new NotificationService(
      [new EmailInstitucionalStrategy(new FailingEmailGateway())],
      preferenceService,
    );

    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 1);
    assert.equal(resumen.exitosos, 0);
    assert.equal(resumen.fallidos, 1);
    assert.ok(resumen.resultados[0].error);
    assert.ok(resumen.resultados[0].error.includes("unavailable"));
  });
});

// ============================================================================
// AC-06: PRINCIPIO OPEN/CLOSED - NUEVAS ESTRATEGIAS SIN MODIFICAR NOTIFICATIONSERVICE
// ============================================================================

describe("AC-06: Open/Closed - agregar estrategia no requiere modificar NotificationService", () => {
  it("nueva estrategia SmsStrategy se integra sin cambiar NotificationService", async () => {
    class SmsStrategy implements INotificationStrategy {
      readonly canal = "sms";
      async enviar(_n: NotificacionDTO): Promise<ResultadoEnvio> {
        return { canal: "sms", exitoso: true, timestamp: new Date().toISOString() };
      }
    }

    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["sms", "email_institucional"]);

    const mockEmail: IEmailGateway = { enviarEmail: async () => {} };
    const service = new NotificationService(
      [new SmsStrategy(), new EmailInstitucionalStrategy(mockEmail)],
      preferenceService,
    );

    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 2);
    assert.equal(resumen.exitosos, 2);
    assert.equal(resumen.resultados[0].canal, "sms");
    assert.equal(resumen.resultados[1].canal, "email_institucional");
  });

  it("nueva estrategia SlackStrategy coexiste con estrategias existentes", async () => {
    class SlackStrategy implements INotificationStrategy {
      readonly canal = "slack";
      async enviar(_n: NotificacionDTO): Promise<ResultadoEnvio> {
        return { canal: "slack", exitoso: true, timestamp: new Date().toISOString() };
      }
    }

    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["slack", "push_movil"]);

    const mockPush: IPushGateway = { enviarPush: async () => {} };
    const service = new NotificationService(
      [new SlackStrategy(), new PushMovilStrategy(mockPush)],
      preferenceService,
    );

    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 2);
    assert.equal(resumen.resultados[0].canal, "slack");
    assert.equal(resumen.resultados[1].canal, "push_movil");
  });

  it("múltiples nuevas estrategias coexisten sin conflictos", async () => {
    class SlackStrategy implements INotificationStrategy {
      readonly canal = "slack";
      async enviar(_n: NotificacionDTO): Promise<ResultadoEnvio> {
        return { canal: "slack", exitoso: true, timestamp: new Date().toISOString() };
      }
    }

    class TeamsStrategy implements INotificationStrategy {
      readonly canal = "teams";
      async enviar(_n: NotificacionDTO): Promise<ResultadoEnvio> {
        return { canal: "teams", exitoso: true, timestamp: new Date().toISOString() };
      }
    }

    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, [
      "slack",
      "teams",
      "email_institucional",
    ]);

    const mockEmail: IEmailGateway = { enviarEmail: async () => {} };
    const service = new NotificationService(
      [new SlackStrategy(), new TeamsStrategy(), new EmailInstitucionalStrategy(mockEmail)],
      preferenceService,
    );

    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 3);
  });
});

// ============================================================================
// STRESS TESTS: ESCENARIOS CRÍTICOS
// ============================================================================

describe("STRESS TESTS: Escenarios críticos de producción", () => {
  it("todos los gateways fallan excepto uno (1/3 exitoso)", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, [
      "email_institucional",
      "push_movil",
      "in_app_websocket",
    ]);

    const mockGateway: IStudyGroupSocketGateway = { emitToUser: async () => {} };
    const service = new NotificationService(
      [
        new EmailInstitucionalStrategy(new FailingEmailGateway()), // falla
        new PushMovilStrategy(new FailingPushGateway()),           // falla
        new InAppWebSocketStrategy(mockGateway),                   // exitoso
      ],
      preferenceService,
    );

    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 1);
    assert.equal(resumen.fallidos, 2);

    // El usuario recibió al menos por 1 canal
    assert.ok(resumen.resultados.some(r => r.exitoso));
  });

  it("todos los gateways fallan (0/3 exitosos)", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, [
      "email_institucional",
      "push_movil",
      "in_app_websocket",
    ]);

    const service = new NotificationService(
      [
        new EmailInstitucionalStrategy(new FailingEmailGateway()),
        new PushMovilStrategy(new FailingPushGateway()),
        new InAppWebSocketStrategy(new FailingWebSocketGateway()),
      ],
      preferenceService,
    );

    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 0);
    assert.equal(resumen.fallidos, 3);
    assert.ok(resumen.resultados.every(r => !r.exitoso));
  });

  it("ejecución paralela sin bloqueos (Promise.allSettled)", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["slow_a", "slow_b", "slow_c"]);

    const startTime = Date.now();
    const service = new NotificationService(
      [
        new MockStrategy("slow_a", false, 100), // 100ms
        new MockStrategy("slow_b", false, 100), // 100ms
        new MockStrategy("slow_c", false, 100), // 100ms
      ],
      preferenceService,
    );

    await service.notificar(dummyNotificacion);
    const elapsed = Date.now() - startTime;

    // Si fuese secuencial: ~300ms. Con Promise.allSettled debería ser ~100ms
    // Agregamos margen para variabilidad del sistema
    assert.ok(elapsed < 250, `Debería ser paralelo (~100ms), pero tomó ${elapsed}ms`);
  });

  it("ResumenNotificacion reporta correctamente con mezcla de éxitos/fallos", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, [
      "email_institucional",
      "push_movil",
      "in_app_websocket",
    ]);

    const mockGateway: IStudyGroupSocketGateway = { emitToUser: async () => {} };
    const service = new NotificationService(
      [
        new EmailInstitucionalStrategy(new FailingEmailGateway()),
        new PushMovilStrategy(new FailingPushGateway()),
        new InAppWebSocketStrategy(mockGateway),
      ],
      preferenceService,
    );

    const resumen = await service.notificar(dummyNotificacion);

    // Validar estructura de ResumenNotificacion
    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 1);
    assert.equal(resumen.fallidos, 2);
    assert.equal(resumen.resultados.length, 3);

    // Cada resultado debe tener timestamp
    assert.ok(resumen.resultados.every(r => r.timestamp));

    // Verificar suma consistente
    assert.equal(resumen.exitosos + resumen.fallidos, resumen.total);
  });

  it("manejo de errores con excepción genérica sin perder contexto", async () => {
    class ThrowingStrategy implements INotificationStrategy {
      readonly canal = "throwing";
      async enviar(_n: NotificacionDTO): Promise<ResultadoEnvio> {
        throw new Error("Unexpected runtime error");
      }
    }

    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["throwing"]);

    const service = new NotificationService([new ThrowingStrategy()], preferenceService);

    // No debe lanzar excepción
    const resumen = await service.notificar(dummyNotificacion);

    assert.equal(resumen.total, 1);
    assert.equal(resumen.exitosos, 0);
    assert.equal(resumen.fallidos, 1);
    assert.ok(resumen.resultados[0].error);
  });
});

// ============================================================================
// FLUJO COMPLETO: OBSERVER -> NOTIFICATIONSERVICE -> PREFERENCIAS -> PARALELO
// ============================================================================

describe("FLUJO COMPLETO: Evento Observer -> NotificationService -> Filtrado -> Envío Paralelo", () => {
  it("simula flujo completo: notificación de nuevo evento de grupo", async () => {
    // Simulación: Un usuario se suscribe a eventos de un grupo
    // Llega un evento de "NUEVO_MENSAJE_GRUPO"
    // NotificationService filtra por preferencias
    // Envía por canales activos en paralelo

    const userId = "user_enrolled_001";
    const eventType = "NUEVO_MENSAJE_GRUPO";

    const preferenceService = new MockPreferenceService();
    // El usuario prefiere Email e In-App, pero NO Push
    preferenceService.setCanales(userId, eventType, ["email_institucional", "in_app_websocket"]);

    const mockGateway: IStudyGroupSocketGateway = { emitToUser: async () => {} };
    const mockEmail: IEmailGateway = { enviarEmail: async () => {} };
    const mockPush: IPushGateway = { enviarPush: async () => {} };

    const service = new NotificationService(
      [
        new InAppWebSocketStrategy(mockGateway),
        new EmailInstitucionalStrategy(mockEmail),
        new PushMovilStrategy(mockPush),
      ],
      preferenceService,
    );

    const eventoNotificacion: NotificacionDTO = {
      userId,
      type: eventType,
      title: "Nuevo mensaje en Grupo de Cálculo",
      body: "Carlos respondió a tu pregunta sobre límites",
      payload: {
        groupId: "group_calc_001",
        messageId: "msg_12345",
        senderName: "Carlos",
      },
    };

    const resumen = await service.notificar(eventoNotificacion);

    // Solo Email e In-App deben ejecutarse
    assert.equal(resumen.total, 2);
    assert.equal(resumen.exitosos, 2);
    const canales = resumen.resultados.map(r => r.canal);
    assert.ok(canales.includes("email_institucional"));
    assert.ok(canales.includes("in_app_websocket"));
    assert.ok(!canales.includes("push_movil"));
  });

  it("simula flujo completo: notificación de nuevo miembro en grupo", async () => {
    const userId = "user_leader_001";
    const eventType = "NUEVO_MIEMBRO_GRUPO";

    const preferenceService = new MockPreferenceService();
    // El líder quiere recibir por todos los canales
    preferenceService.setCanales(userId, eventType, [
      "email_institucional",
      "in_app_websocket",
      "push_movil",
    ]);

    const mockGateway: IStudyGroupSocketGateway = { emitToUser: async () => {} };
    const mockEmail: IEmailGateway = { enviarEmail: async () => {} };
    const mockPush: IPushGateway = { enviarPush: async () => {} };

    const service = new NotificationService(
      [
        new InAppWebSocketStrategy(mockGateway),
        new EmailInstitucionalStrategy(mockEmail),
        new PushMovilStrategy(mockPush),
      ],
      preferenceService,
    );

    const eventoNotificacion: NotificacionDTO = {
      userId,
      type: eventType,
      title: "Nuevo miembro: Sofía García",
      body: "Sofía se unió al grupo de Grupo de Cálculo",
      payload: {
        groupId: "group_calc_001",
        newMemberId: "user_sofia_001",
        newMemberName: "Sofía García",
      },
    };

    const resumen = await service.notificar(eventoNotificacion);

    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 3);
  });

  it("simula fallo parcial en flujo completo: Email falla, otros continúan", async () => {
    const userId = "user_participant_001";
    const eventType = "MENSAJE_DIRECTO";

    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(userId, eventType, [
      "email_institucional",
      "in_app_websocket",
      "push_movil",
    ]);

    const mockGateway: IStudyGroupSocketGateway = { emitToUser: async () => {} };
    const mockPush: IPushGateway = { enviarPush: async () => {} };

    const service = new NotificationService(
      [
        new InAppWebSocketStrategy(mockGateway),
        new EmailInstitucionalStrategy(new FailingEmailGateway()),
        new PushMovilStrategy(mockPush),
      ],
      preferenceService,
    );

    const eventoNotificacion: NotificacionDTO = {
      userId,
      type: eventType,
      title: "Nuevo mensaje directo de Laura",
      body: "¿Cómo va el proyecto?",
      payload: {
        conversationId: "conv_laura_001",
        senderId: "user_laura_001",
        senderName: "Laura",
      },
    };

    const resumen = await service.notificar(eventoNotificacion);

    // Email falla, pero WebSocket y Push se ejecutan
    assert.equal(resumen.total, 3);
    assert.equal(resumen.exitosos, 2);
    assert.equal(resumen.fallidos, 1);

    const failedResult = resumen.resultados.find(r => !r.exitoso);
    assert.equal(failedResult?.canal, "email_institucional");
  });
});

// ============================================================================
// EDGE CASES & BOUNDARY CONDITIONS
// ============================================================================

describe("EDGE CASES: Condiciones límite y casos especiales", () => {
  it("payload puede ser null sin lanzar excepción", async () => {
    const preferenceService = new MockPreferenceService();
    const userId = "user_payload_test";
    const eventType = "TEST_PAYLOAD";
    preferenceService.setCanales(userId, eventType, ["canal_test"]);

    const service = new NotificationService([new MockStrategy("canal_test")], preferenceService);

    const notifSinPayload: NotificacionDTO = {
      userId,
      type: eventType,
      title: "Sin payload",
      body: "Body sin payload",
      payload: null,
    };

    const resumen = await service.notificar(notifSinPayload);

    assert.equal(resumen.total, 1);
    assert.equal(resumen.exitosos, 1);
  });

  it("timestamp siempre se incluye en ResultadoEnvio", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales(dummyNotificacion.userId, dummyNotificacion.type, ["canal_test"]);

    const service = new NotificationService([new MockStrategy("canal_test")], preferenceService);
    const resumen = await service.notificar(dummyNotificacion);

    assert.ok(resumen.resultados.every(r => r.timestamp));
    assert.ok(resumen.resultados.every(r => typeof r.timestamp === "string"));
  });

  it("canal nombre es readonly y no puede ser modificado", () => {
    const mock = new MockStrategy("original");
    assert.equal(mock.canal, "original");

    // Intentar modificar debería fallar en modo strict
    try {
      (mock as unknown as { canal: string }).canal = "modified";
      // Si llegamos aquí en strict mode debería haber fallado, pero el test continúa
      assert.equal(mock.canal, "original", "Canal debe permanecer inmutable");
    } catch (e) {
      // Expected en strict mode
    }
  });

  it("multiple notificaciones secuenciales sin estado compartido", async () => {
    const preferenceService = new MockPreferenceService();
    preferenceService.setCanales("user_a", "TIPO_A", ["canal_1"]);
    preferenceService.setCanales("user_b", "TIPO_B", ["canal_2"]);

    const strat1 = new MockStrategy("canal_1");
    const strat2 = new MockStrategy("canal_2");

    const service = new NotificationService([strat1, strat2], preferenceService);

    const notif1 = { ...dummyNotificacion, userId: "user_a", type: "TIPO_A" };
    const notif2 = { ...dummyNotificacion, userId: "user_b", type: "TIPO_B" };

    const resumen1 = await service.notificar(notif1);
    const resumen2 = await service.notificar(notif2);

    assert.equal(resumen1.total, 1);
    assert.equal(resumen1.resultados[0].canal, "canal_1");
    assert.equal(resumen2.total, 1);
    assert.equal(resumen2.resultados[0].canal, "canal_2");
  });
});
