import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { UpdateAvailability } from "../src/application/use-cases/UpdateAvailability.js";
import { InMemoryStudySessionRepository } from "../src/infrastructure/database/InMemoryStudySessionRepository.js";
import { InMemorySessionAttendeeRepository } from "../src/infrastructure/database/InMemorySessionAttendeeRepository.js";
import type { IStudyGroupRepository } from "../src/domain/repositories/IStudyGroupRepository.js";
import type { ISubject } from "../src/domain/events/observers/ISubject.js";
import type { GroupContext } from "../src/domain/states/GroupContext.js";
import type { StudyGroupEvent } from "../src/domain/events/StudyGroupEvents.js";

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

describe("UpdateAvailability", () => {
  it("confirms attendance and emits AVAILABILITY_UPDATED event", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const attendeeRepo = new InMemorySessionAttendeeRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const subject = createMockSubject();
    const uc = new UpdateAvailability(attendeeRepo, sessionRepo, groupRepo, subject);

    const session = await sessionRepo.create({
      seriesId: null,
      requestId: "req-1",
      title: "Test Group",
      startTime: "2026-06-15T14:00:00.000Z",
      endTime: "2026-06-15T15:00:00.000Z",
      location: null,
      remindAt: "2026-06-15T13:30:00.000Z",
      createdBy: "user-admin",
    });
    sessionRepo.setGroupMembers("req-1", ["user-admin", "user-member"]);

    const result = await uc.execute(session.id, "user-member", "Juan Perez", "confirmed");

    assert.equal(result.status, "confirmed");
    assert.equal(result.sessionId, session.id);

    const emitted = (subject.emit as unknown as ReturnType<typeof mock.fn>).mock.calls[0].arguments[0] as Extract<StudyGroupEvent, { type: "AVAILABILITY_UPDATED" }>;
    assert.equal(emitted.type, "AVAILABILITY_UPDATED");
    assert.equal(emitted.userId, "user-member");
    assert.equal(emitted.userName, "Juan Perez");
    assert.equal(emitted.status, "confirmed");
  });

  it("declines attendance and emits event", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const attendeeRepo = new InMemorySessionAttendeeRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const subject = createMockSubject();
    const uc = new UpdateAvailability(attendeeRepo, sessionRepo, groupRepo, subject);

    const session = await sessionRepo.create({
      seriesId: null,
      requestId: "req-1",
      title: "Test Group",
      startTime: "2026-06-15T14:00:00.000Z",
      endTime: "2026-06-15T15:00:00.000Z",
      location: null,
      remindAt: "2026-06-15T13:30:00.000Z",
      createdBy: "user-admin",
    });
    sessionRepo.setGroupMembers("req-1", ["user-admin", "user-member"]);

    const result = await uc.execute(session.id, "user-member", "Juan Perez", "declined");

    assert.equal(result.status, "declined");
  });
});
