import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { CancelStudySession } from "../src/application/use-cases/CancelStudySession.js";
import { InMemoryStudySessionRepository } from "../src/infrastructure/database/InMemoryStudySessionRepository.js";
import { InMemorySessionAttendeeRepository } from "../src/infrastructure/database/InMemorySessionAttendeeRepository.js";
import type { IStudyGroupRepository } from "../src/domain/repositories/IStudyGroupRepository.js";
import type { ISubject } from "../src/domain/events/observers/ISubject.js";
import type { GroupContext } from "../src/domain/states/GroupContext.js";
import type { StudyGroupEvent } from "../src/domain/events/StudyGroupEvents.js";
import { ConflictError, NotFoundError } from "../../../shared/libs/errors/index.js";

function createMockGroupRepo(adminId: string): IStudyGroupRepository {
  return {
    loadStudyGroup: mock.fn(async () => ({
      requestId: "req-1",
      groupName: "Test Group",
      adminId,
    } as unknown as GroupContext)),
  };
}

function createMockSubject(): ISubject {
  return {
    subscribe: mock.fn(),
    unsubscribe: mock.fn(),
    emit: mock.fn(async () => {}),
  };
}

describe("CancelStudySession", () => {
  it("cancels a scheduled session and emits SESSION_CANCELLED event", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const attendeeRepo = new InMemorySessionAttendeeRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const subject = createMockSubject();
    const uc = new CancelStudySession(sessionRepo, groupRepo, attendeeRepo, subject);

    const session = await sessionRepo.create({
      seriesId: null,
      requestId: "req-1",
      title: "Study Session",
      startTime: "2026-06-15T14:00:00.000Z",
      endTime: "2026-06-15T15:00:00.000Z",
      location: null,
      remindAt: "2026-06-15T13:30:00.000Z",
      createdBy: "user-admin",
    });

    const result = await uc.execute(session.id, "user-admin");

    assert.equal(result.status, "cancelled");
    assert.equal((subject.emit as unknown as ReturnType<typeof mock.fn>).mock.calls.length, 1);

    const emitted = (subject.emit as unknown as ReturnType<typeof mock.fn>).mock.calls[0].arguments[0] as Extract<StudyGroupEvent, { type: "SESSION_CANCELLED" }>;
    assert.equal(emitted.type, "SESSION_CANCELLED");
    assert.equal(emitted.sessionId, session.id);
    assert.equal(emitted.requestId, "req-1");
    assert.ok(Array.isArray(emitted.attendeeIds));
  });

  it("throws NotFoundError for non-existent session", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const attendeeRepo = new InMemorySessionAttendeeRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const subject = createMockSubject();
    const uc = new CancelStudySession(sessionRepo, groupRepo, attendeeRepo, subject);

    await assert.rejects(
      () => uc.execute("nonexistent-id", "user-admin"),
      NotFoundError,
    );
  });

  it("throws ConflictError for already cancelled session", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const attendeeRepo = new InMemorySessionAttendeeRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const subject = createMockSubject();
    const uc = new CancelStudySession(sessionRepo, groupRepo, attendeeRepo, subject);

    const session = await sessionRepo.create({
      seriesId: null,
      requestId: "req-1",
      title: "Study Session",
      startTime: "2026-06-15T14:00:00.000Z",
      endTime: "2026-06-15T15:00:00.000Z",
      location: null,
      remindAt: "2026-06-15T13:30:00.000Z",
      createdBy: "user-admin",
    });

    await sessionRepo.cancel(session.id);

    await assert.rejects(
      () => uc.execute(session.id, "user-admin"),
      ConflictError,
    );
  });
});
