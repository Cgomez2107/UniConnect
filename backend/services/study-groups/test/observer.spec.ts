import type { StudyGroupEvent } from "../src/domain/events/StudyGroupEvents.js";
import type { IObserver } from "../src/domain/events/observers/IObserver.js";
import type { ISubject } from "../src/domain/events/observers/ISubject.js";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

type SpyCall<Args extends unknown[]> = Args;

type SpyFn<Args extends unknown[], Return> = ((...args: Args) => Return) & {
  mock: {
    calls: SpyCall<Args>[];
  };
  mockImplementation(implementation: (...args: Args) => Return): SpyFn<Args, Return>;
  mockResolvedValue(value: Awaited<Return>): SpyFn<Args, Return>;
};

function createSpy<Args extends unknown[], Return>(
  implementation?: (...args: Args) => Return,
): SpyFn<Args, Return> {
  let currentImplementation = implementation;

  const spy = ((...args: Args) => {
    spy.mock.calls.push(args);

    if (!currentImplementation) {
      return undefined as Return;
    }

    return currentImplementation(...args);
  }) as SpyFn<Args, Return>;

  spy.mock = { calls: [] };

  spy.mockImplementation = (nextImplementation) => {
    currentImplementation = nextImplementation;
    return spy;
  };

  spy.mockResolvedValue = (value) => {
    currentImplementation = (() => Promise.resolve(value)) as (...args: Args) => Return;
    return spy;
  };

  return spy;
}

export class MockObserver implements IObserver {
  readonly name: string;

  readonly handle: SpyFn<[StudyGroupEvent], Promise<void>>;

  constructor(name: string = "MockObserver") {
    this.name = name;
    this.handle = createSpy<[StudyGroupEvent], Promise<void>>();
    this.handle.mockResolvedValue(undefined);
  }
}

export class MockSubject implements ISubject {
  private readonly observers = new Set<IObserver>();

  readonly subscribeSpy: SpyFn<[IObserver], void>;

  readonly unsubscribeSpy: SpyFn<[IObserver], void>;

  readonly emitSpy: SpyFn<[StudyGroupEvent], Promise<void>>;

  constructor() {
    this.subscribeSpy = createSpy<[IObserver], void>((observer) => {
      this.observers.add(observer);
    });

    this.unsubscribeSpy = createSpy<[IObserver], void>((observer) => {
      this.observers.delete(observer);
    });

    this.emitSpy = createSpy<[StudyGroupEvent], Promise<void>>(async (event) => {
      const tasks = Array.from(this.observers).map(async (observer) => {
        try {
          await observer.handle(event);
        } catch {
          // Aislamiento de fallos: un observer con error no detiene a los demas.
        }
      });

      await Promise.allSettled(tasks);
    });
  }

  subscribe(observer: IObserver): void {
    this.subscribeSpy(observer);
  }

  unsubscribe(observer: IObserver): void {
    this.unsubscribeSpy(observer);
  }

  async emit(event: StudyGroupEvent): Promise<void> {
    await this.emitSpy(event);
  }

  getObserverCount(): number {
    return this.observers.size;
  }

  clear(): void {
    this.observers.clear();
  }
}

describe("Observer Pattern - Subscription and Notification", () => {
  it("notifica a los 2 observers suscritos con el evento correcto", async () => {
    const subject = new MockSubject();
    const observerOne = new MockObserver("ObserverOne");
    const observerTwo = new MockObserver("ObserverTwo");

    const event: StudyGroupEvent = {
      type: "SOLICITUD_INGRESO",
      version: "1.0",
      timestamp: new Date("2026-04-29T10:00:00.000Z"),
      requestId: "req-1",
      applicantId: "user-123",
      recipientUserId: "user-456",
      message: "Hola, quiero unirme al grupo",
      groupName: "Test Group",
      applicantName: "Test Applicant",
    };

    subject.subscribe(observerOne);
    subject.subscribe(observerTwo);

    await subject.emit(event);

    assert.equal(observerOne.handle.mock.calls.length, 1);
    assert.equal(observerTwo.handle.mock.calls.length, 1);
    assert.deepEqual(observerOne.handle.mock.calls[0][0], event);
    assert.deepEqual(observerTwo.handle.mock.calls[0][0], event);
  });

  it("no notifica al observer desuscrito y si al que sigue suscrito", async () => {
    const subject = new MockSubject();
    const observerOne = new MockObserver("ObserverOne");
    const observerTwo = new MockObserver("ObserverTwo");

    const event: StudyGroupEvent = {
      type: "SOLICITUD_INGRESO",
      version: "1.0",
      timestamp: new Date("2026-04-29T10:05:00.000Z"),
      requestId: "req-2",
      applicantId: "user-789",
      recipientUserId: "user-456",
      message: "Quiero participar en el grupo",
      groupName: "Test Group",
      applicantName: "Test Applicant",
    };

    subject.subscribe(observerOne);
    subject.subscribe(observerTwo);

    subject.unsubscribe(observerOne);
    await subject.emit(event);

    assert.equal(observerOne.handle.mock.calls.length, 0);
    assert.equal(observerTwo.handle.mock.calls.length, 1);
    assert.deepEqual(observerTwo.handle.mock.calls[0][0], event);
  });

  it("aun con error en un observer, mantiene el flujo y notifica al restante", async () => {
    const subject = new MockSubject();
    const failingObserver = new MockObserver("FailingObserver");
    const healthyObserver = new MockObserver("HealthyObserver");

    const event: StudyGroupEvent = {
      type: "SOLICITUD_INGRESO",
      version: "1.0",
      timestamp: new Date("2026-04-29T10:10:00.000Z"),
      requestId: "req-3",
      applicantId: "user-111",
      recipientUserId: "user-222",
      message: "Evento para prueba de resiliencia",
      groupName: "Test Group",
      applicantName: "Test Applicant",
    };

    failingObserver.handle.mockImplementation(async () => {
      throw new Error("Fallo intencional en observer");
    });

    subject.subscribe(failingObserver);
    subject.subscribe(healthyObserver);

    await subject.emit(event);

    assert.equal(failingObserver.handle.mock.calls.length, 1);
    assert.equal(healthyObserver.handle.mock.calls.length, 1);
    assert.deepEqual(healthyObserver.handle.mock.calls[0][0], event);
  });
});