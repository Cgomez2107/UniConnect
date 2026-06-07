import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { InMemoryStudySessionRepository } from "../src/infrastructure/database/InMemoryStudySessionRepository.js";
import { SessionScheduler } from "../src/application/services/SessionScheduler.js";

describe("SessionScheduler", () => {
  it("sends reminders for pending sessions and marks them reminded", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const mockNotify = mock.fn(async () => ({ total: 1, exitosos: 1, fallidos: 0, resultados: [] }));
    const notificationService = {
      notificar: mockNotify,
    } as any;
    const scheduler = new SessionScheduler(sessionRepo as any, notificationService);

    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const session = await sessionRepo.create({
      seriesId: null,
      requestId: "req-1",
      title: "Study Session",
      startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      location: null,
      remindAt: pastDate,
      createdBy: "user-admin",
    });
    sessionRepo.setAttendeeUserIds(session.id, ["user-1", "user-2"]);

    scheduler.start();
    await new Promise(resolve => setTimeout(resolve, 200));
    scheduler.stop();

    const reminded = await sessionRepo.getById(session.id);
    assert.ok(reminded?.reminded);
    // 2 confirmed attendees + 1 creator = 3 recipients
    assert.equal(mockNotify.mock.calls.length, 3);
  });

  it("skips already reminded sessions", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const mockNotify = mock.fn(async () => ({ total: 1, exitosos: 1, fallidos: 0, resultados: [] }));
    const notificationService = {
      notificar: mockNotify,
    } as any;
    const scheduler = new SessionScheduler(sessionRepo as any, notificationService);

    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await sessionRepo.create({
      seriesId: null,
      requestId: "req-1",
      title: "Study Session",
      startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      location: null,
      remindAt: pastDate,
      createdBy: "user-admin",
    });

    scheduler.start();
    await new Promise(resolve => setTimeout(resolve, 200));
    scheduler.stop();

    scheduler.start();
    await new Promise(resolve => setTimeout(resolve, 200));
    scheduler.stop();

    // Creator is included as recipient (no confirmed attendees, just the creator)
    assert.equal(mockNotify.mock.calls.length, 1);
  });

  it("stops polling when stop() is called", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    let callCount = 0;
    const originalFind = sessionRepo.findPendingReminders.bind(sessionRepo);
    sessionRepo.findPendingReminders = async () => {
      callCount++;
      return originalFind();
    };
    const mockNotify = mock.fn(async () => ({ total: 1, exitosos: 1, fallidos: 0, resultados: [] }));
    const notificationService = { notificar: mockNotify } as any;
    const scheduler = new SessionScheduler(sessionRepo as any, notificationService);

    scheduler.start();
    await new Promise(resolve => setTimeout(resolve, 100));
    scheduler.stop();
    const countAfterStop = callCount;
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(callCount, countAfterStop);
  });
});
