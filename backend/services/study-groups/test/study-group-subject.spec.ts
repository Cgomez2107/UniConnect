import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { StudyGroupEvent } from "../src/domain/events/StudyGroupEvents.js";
import type { IObserver } from "../src/domain/events/observers/IObserver.js";
import { StudyGroupSubject } from "../src/domain/events/observers/StudyGroupSubject.js";

class MockObserver implements IObserver {
  readonly name: string;

  readonly receivedEvents: StudyGroupEvent[] = [];

  constructor(name: string = "MockObserver") {
    this.name = name;
  }

  async handle(event: StudyGroupEvent): Promise<void> {
    this.receivedEvents.push(event);
  }
}

describe("StudyGroupSubject integration", () => {
  it("entrega el evento emitido al observer suscrito", async () => {
    const subject = new StudyGroupSubject("StudyGroupSubjectTest");
    const observer = new MockObserver("Observer-A");

    const event: StudyGroupEvent = {
      type: "SOLICITUD_INGRESO",
      version: "1.0",
      timestamp: new Date("2026-04-29T11:00:00.000Z"),
      requestId: "req-int-1",
      applicantId: "student-1",
      recipientUserId: "admin-1",
      message: "Solicitud de ingreso para prueba de integracion",
    };

    subject.subscribe(observer);
    await subject.emit(event);

    assert.equal(observer.receivedEvents.length, 1);
    assert.deepEqual(observer.receivedEvents[0], event);
  });
});
