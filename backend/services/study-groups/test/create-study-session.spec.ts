import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import { CreateStudySession } from "../src/application/use-cases/CreateStudySession.js";
import { InMemoryStudySessionRepository } from "../src/infrastructure/database/InMemoryStudySessionRepository.js";
import { InMemorySessionSeriesRepository } from "../src/infrastructure/database/InMemorySessionSeriesRepository.js";
import type { IStudyGroupRepository } from "../src/domain/repositories/IStudyGroupRepository.js";
import type { IMemberRepository } from "../src/domain/repositories/IMemberRepository.js";
import type { ISubject } from "../src/domain/events/observers/ISubject.js";
import type { GroupContext } from "../src/domain/states/GroupContext.js";

function createMockGroupRepo(adminId: string): IStudyGroupRepository {
  return {
    loadStudyGroup: mock.fn(async () => ({
      requestId: "req-1",
      groupName: "Test Group",
      adminId,
      adminCount: 1,
      membersCount: 3,
    } as unknown as GroupContext)),
  };
}

const noopSubject: ISubject = {
  subscribe: () => {},
  unsubscribe: () => {},
  emit: async () => {},
};

const noopMemberRepo: IMemberRepository = {
  listByRequest: async () => [],
  findByGroup: async () => [],
};

describe("CreateStudySession — executeSingle", () => {
  it("creates a single session with remind_at set 30 min before start", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const seriesRepo = new InMemorySessionSeriesRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const uc = new CreateStudySession(sessionRepo, seriesRepo, groupRepo, noopMemberRepo, noopSubject);

    const result = await uc.executeSingle({
      actorUserId: "user-admin",
      requestId: "req-1",
      startTime: "2026-06-15T14:00:00.000Z",
      durationMinutes: 60,
    });

    assert.equal(result.type, "single");
    assert.ok(result.session.id);
    assert.equal(result.session.requestId, "req-1");
    assert.equal(result.session.status, "scheduled");

    const expectedRemindAt = new Date("2026-06-15T13:30:00.000Z").toISOString();
    assert.equal(result.session.remindAt, expectedRemindAt);
  });

  it("rejects non-admin users", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const seriesRepo = new InMemorySessionSeriesRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const uc = new CreateStudySession(sessionRepo, seriesRepo, groupRepo, noopMemberRepo, noopSubject);

    await assert.rejects(
      () => uc.executeSingle({
        actorUserId: "user-other",
        requestId: "req-1",
        startTime: "2026-06-15T14:00:00.000Z",
        durationMinutes: 60,
      }),
    );
  });
});

describe("CreateStudySession — executeRecurring", () => {
  it("creates a weekly series with materialized instances", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const seriesRepo = new InMemorySessionSeriesRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const uc = new CreateStudySession(sessionRepo, seriesRepo, groupRepo, noopMemberRepo, noopSubject);

    const result = await uc.executeRecurring({
      actorUserId: "user-admin",
      requestId: "req-1",
      startDate: "2026-06-01",
      endDate: "2026-06-21",
      time: "14:00",
      durationMinutes: 60,
      daysOfWeek: [1, 3, 5],
      frequency: "weekly",
    });

    assert.equal(result.type, "recurring");
    assert.ok(result.series.id);
    assert.equal(result.series.daysOfWeek.join(","), "1,3,5");
    assert.equal(result.series.frequency, "weekly");

    // June 2026: Mon=1, Wed=3, Fri=5 — from Jun 1 (Mon) to Jun 21 (Sun)
    // Dates: Jun 1(Mon), 3(Wed), 5(Fri), 8(Mon), 10(Wed), 12(Fri), 15(Mon), 17(Wed), 19(Fri) = 9 sessions
    assert.equal(result.count, 9);
    assert.equal(result.sessions.length, 9);
  });

  it("defaults endDate to startDate + 4 weeks", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const seriesRepo = new InMemorySessionSeriesRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const uc = new CreateStudySession(sessionRepo, seriesRepo, groupRepo, noopMemberRepo, noopSubject);

    const result = await uc.executeRecurring({
      actorUserId: "user-admin",
      requestId: "req-1",
      startDate: "2026-06-01",
      time: "14:00",
      durationMinutes: 60,
      daysOfWeek: [1],
      frequency: "weekly",
    });

    assert.equal(result.type, "recurring");
    // 4 weeks from Jun 1 = Jun 29 -> 5 Mondays (Jun 1, 8, 15, 22, 29)
    assert.equal(result.count, 5);
  });

  it("rejects > 52 weeks range", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const seriesRepo = new InMemorySessionSeriesRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const uc = new CreateStudySession(sessionRepo, seriesRepo, groupRepo, noopMemberRepo, noopSubject);

    await assert.rejects(
      () => uc.executeRecurring({
        actorUserId: "user-admin",
        requestId: "req-1",
        startDate: "2026-01-01",
        endDate: "2028-01-01",
        time: "14:00",
        durationMinutes: 60,
        daysOfWeek: [1],
        frequency: "weekly",
      }),
    );
  });

  it("rejects invalid daysOfWeek values", async () => {
    const sessionRepo = new InMemoryStudySessionRepository();
    const seriesRepo = new InMemorySessionSeriesRepository();
    const groupRepo = createMockGroupRepo("user-admin");
    const uc = new CreateStudySession(sessionRepo, seriesRepo, groupRepo, noopMemberRepo, noopSubject);

    await assert.rejects(
      () => uc.executeRecurring({
        actorUserId: "user-admin",
        requestId: "req-1",
        startDate: "2026-06-01",
        time: "14:00",
        durationMinutes: 60,
        daysOfWeek: [7],
        frequency: "weekly",
      }),
    );
  });
});
